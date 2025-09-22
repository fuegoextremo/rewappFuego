-- ============================================
-- MIGRACIÓN: Mantener streak en último threshold al completar
-- ============================================
-- Objetivo: Cuando se completa una racha (alcanza el último premio configurado),
-- mantener el contador en ese valor en lugar de resetearlo a 0.
-- Solo afecta el comportamiento de completación exitosa.

-- Verificar que la función existe antes de modificarla
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'process_checkin' 
    AND pg_get_function_identity_arguments(oid) = 'p_user uuid, p_branch uuid, p_spins_earned integer'
  ) THEN
    RAISE EXCEPTION 'Función process_checkin no encontrada. Migración abortada.';
  END IF;
END $$;

-- ============================================
-- REEMPLAZAR FUNCIÓN process_checkin
-- ============================================
CREATE OR REPLACE FUNCTION public.process_checkin(
  p_user uuid,
  p_branch uuid,
  p_spins_earned int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
  v_previous_last_checkin timestamptz;
  v_previous_expires_at timestamptz;
  v_streak_created_at timestamptz;
  v_expiry_days int := 90;
  v_break_days int := 1;
  v_max_checkins_daily int := 1;
  v_today_checkins int := 0;
  v_streak_expired boolean := false;
  v_streak_broken boolean := false;
  v_new_current_count int;
  v_max_threshold int;
  v_prize_record RECORD;
BEGIN
  -- ============================================
  -- 1. VALIDAR USUARIO
  -- ============================================
  SELECT * INTO v_user_record 
  FROM public.user_profiles 
  WHERE id = p_user;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario % no encontrado', p_user;
  END IF;

  -- ============================================
  -- 2. CARGAR CONFIGURACIÓN SISTEMA
  -- ============================================
  SELECT 
    COALESCE(streak_expiry_days, 90) as expiry,
    COALESCE(streak_break_days, 1) as break_days,
    COALESCE(max_checkins_per_day, 1) as max_daily
  INTO v_expiry_days, v_break_days, v_max_checkins_daily
  FROM public.system_settings 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- ============================================
  -- 3. VERIFICAR LÍMITE DE CHECK-INS DIARIOS
  -- ============================================
  SELECT COUNT(*) INTO v_today_checkins
  FROM public.check_ins
  WHERE user_id = p_user 
    AND check_in_date::date = CURRENT_DATE;

  IF v_today_checkins >= v_max_checkins_daily THEN
    RAISE EXCEPTION 'Límite de check-ins diarios alcanzado: % de %', v_today_checkins, v_max_checkins_daily;
  END IF;

  -- ============================================
  -- 4. OBTENER THRESHOLD MÁXIMO CONFIGURADO
  -- ============================================
  SELECT MAX(streak_threshold) INTO v_max_threshold
  FROM public.prizes 
  WHERE type = 'streak' 
    AND is_active = true 
    AND streak_threshold IS NOT NULL
    AND (deleted_at IS NULL);

  -- ============================================
  -- 5. CREAR CHECK-IN REGISTRO
  -- ============================================
  INSERT INTO public.check_ins(user_id, branch_id, spins_earned, check_in_date, created_at)
  VALUES (p_user, p_branch, p_spins_earned, NOW(), NOW());

  -- ============================================
  -- 6. OBTENER DATOS PREVIOS DE RACHA
  -- ============================================
  SELECT last_check_in, expires_at, created_at 
  INTO v_previous_last_checkin, v_previous_expires_at, v_streak_created_at
  FROM public.streaks 
  WHERE user_id = p_user;

  -- Verificar si la racha ha expirado (temporada completa)
  IF v_previous_expires_at IS NOT NULL AND v_previous_expires_at < NOW() THEN
    v_streak_expired := true;
  END IF;

  -- Verificar si la racha se rompió por inactividad
  IF v_streak_created_at IS NOT NULL THEN
    IF EXTRACT(days FROM (NOW() - v_streak_created_at)) > v_break_days THEN
      v_streak_broken := true;
    END IF;
  END IF;

  -- ============================================
  -- 7. ACTUALIZAR/CREAR RACHA CON LÓGICA CORREGIDA
  -- ============================================
  INSERT INTO public.streaks(
    user_id, 
    current_count, 
    max_count, 
    last_check_in, 
    expires_at,
    completed_count,
    is_just_completed,
    created_at, 
    updated_at
  )
  VALUES (
    p_user, 
    1, 
    1, 
    NOW(), 
    NOW() + (v_expiry_days || ' days')::INTERVAL,
    0,
    false,
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    -- 🔥 CORRECCIÓN: Lógica que respeta configuración de múltiples check-ins
    current_count = CASE
      -- Si estaba "recién completada", iniciar nueva racha en 1
      WHEN streaks.is_just_completed = true THEN 1
      -- Racha expirada: Nueva temporada desde 0 (más lógico)
      WHEN v_streak_expired THEN 0
      -- Racha rota: Volver a 0 (más lógico)  
      WHEN v_streak_broken THEN 0
      -- Último check-in fue ayer: Continuar racha incrementando
      WHEN streaks.last_check_in::date = CURRENT_DATE - INTERVAL '1 day' THEN 
        streaks.current_count + 1
      -- 🔥 NUEVO: Último check-in fue hoy Y permite múltiples check-ins: INCREMENTAR
      WHEN streaks.last_check_in::date = CURRENT_DATE AND v_max_checkins_daily > 1 THEN 
        streaks.current_count + 1
      -- Último check-in fue hoy pero solo 1 check-in por día: MANTENER
      WHEN streaks.last_check_in::date = CURRENT_DATE THEN 
        streaks.current_count
      -- Primer check-in del usuario: Iniciar en 1
      ELSE 1
    END,
    
    -- Reset flag de recién completada
    is_just_completed = false,
    
    -- Actualizar max_count considerando incrementos múltiples
    max_count = CASE 
      -- Si fue recién completada, expirada o rota: max_count no menor que 1
      WHEN streaks.is_just_completed = true OR v_streak_expired OR v_streak_broken THEN 
        GREATEST(streaks.max_count, 1)
      -- Último check-in fue ayer: actualizar con nueva cuenta
      WHEN streaks.last_check_in::date = CURRENT_DATE - INTERVAL '1 day' THEN 
        GREATEST(streaks.max_count, streaks.current_count + 1)
      -- Hoy con múltiples check-ins permitidos: actualizar máximo
      WHEN streaks.last_check_in::date = CURRENT_DATE AND v_max_checkins_daily > 1 THEN 
        GREATEST(streaks.max_count, streaks.current_count + 1)
      -- Otros casos: mantener el máximo entre actual y max
      ELSE 
        GREATEST(streaks.max_count, streaks.current_count)
    END,
    
    -- Recalcular expires_at para nueva temporada si expiró
    expires_at = CASE
      WHEN v_streak_expired THEN NOW() + (v_expiry_days || ' days')::INTERVAL
      ELSE streaks.expires_at
    END,
    
    last_check_in = NOW(),
    updated_at = NOW();

  -- ============================================
  -- 8. OBTENER NUEVO CURRENT_COUNT PARA GENERAR CUPONES
  -- ============================================
  SELECT current_count INTO v_new_current_count
  FROM public.streaks 
  WHERE user_id = p_user;

  -- ============================================
  -- 9. GENERAR CUPONES AUTOMÁTICOS POR THRESHOLD
  -- ============================================
  FOR v_prize_record IN 
    SELECT id, streak_threshold, validity_days, name
    FROM public.prizes 
    WHERE type = 'streak' 
      AND is_active = true 
      AND streak_threshold = v_new_current_count
      AND (deleted_at IS NULL)
  LOOP
    -- Generar cupón automático para este threshold
    PERFORM public.grant_manual_coupon(
      p_user, 
      v_prize_record.id, 
      COALESCE(v_prize_record.validity_days, 30)
    );
    
    RAISE NOTICE 'Cupón automático generado: Usuario %, Premio "%" por racha %', 
      p_user, v_prize_record.name, v_prize_record.streak_threshold;
  END LOOP;

  -- ============================================
  -- 10. VERIFICAR COMPLETACIÓN DE RACHA MÁXIMA
  -- ============================================
  IF v_max_threshold IS NOT NULL AND v_new_current_count >= v_max_threshold THEN
    -- 🎯 CAMBIO ESPECÍFICO: Mantener en último threshold en lugar de resetear a 0
    UPDATE public.streaks 
    SET 
      completed_count = completed_count + 1,
      current_count = v_max_threshold,  -- ← NUEVO: Mantener en último threshold
      is_just_completed = true,  -- Flag para UI temporal
      updated_at = NOW()
    WHERE user_id = p_user;
    
    RAISE NOTICE 'Racha completada para usuario %: % visitas alcanzadas, contador mantenido en: %', 
      p_user, v_new_current_count, v_max_threshold;
  END IF;

END;
$$;

-- ============================================
-- COMENTARIOS Y VALIDACIONES FINALES
-- ============================================

COMMENT ON FUNCTION public.process_checkin(uuid, uuid, int) IS 
'Función de check-in ACTUALIZADA: mantiene contador en último threshold al completar racha, reinicia a 0 en rupturas/expiraciones';

-- Verificar que la función se actualizó correctamente
DO $$ 
BEGIN 
  RAISE NOTICE 'Función process_checkin ACTUALIZADA: streak completion mantiene último threshold, rupturas/expiraciones van a 0';
END $$;