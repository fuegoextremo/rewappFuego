-- ============================================
-- MIGRACIÓN: Corregir query de system_settings en process_checkin
-- ============================================
-- Objetivo: Usar get_system_setting() en lugar de SELECT directo
-- porque system_settings usa modelo clave-valor, no columnas directas

-- ============================================
-- MIGRACIÓN: Corregir TODOS los errores de la migración 027
-- ============================================
-- Objetivo: 
-- 1. Usar get_system_setting() en lugar de SELECT directo de system_settings
-- 2. Corregir parámetros de función (p_spins -> p_spins_earned)
-- 3. Restaurar lógica de verificación por rol
-- 4. Mantener lógica correcta de streak completion

CREATE OR REPLACE FUNCTION public.process_checkin(
  p_user uuid,
  p_branch uuid,
  p_spins int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
  v_role text;
  v_my_branch uuid;
  v_existing_checkins int := 0;
  v_final_spins int;
  v_max_checkins_daily int;
  v_expiry_days int;
  v_break_days int;
  v_max_threshold int;
  v_new_current_count int;
  v_previous_expires_at timestamptz;
  v_streak_created_at timestamptz;
  v_last_checkin_date date;
  v_was_just_completed boolean := false;
  v_streak_expired boolean := false;
  v_streak_broken boolean := false;
  v_prize_record RECORD;
BEGIN
  -- ============================================
  -- 1. CARGAR CONFIGURACIÓN SISTEMA (CORREGIDO)
  -- ============================================
  v_final_spins := COALESCE(p_spins, get_system_setting('checkin_points_daily', '1')::int);
  v_max_checkins_daily := get_system_setting('max_checkins_per_day', '1')::int;
  v_expiry_days := get_system_setting('streak_expiry_days', '90')::int;
  v_break_days := get_system_setting('streak_break_days', '1')::int;

  -- ============================================
  -- 2. VERIFICAR PERMISOS Y ROLES (RESTAURADO)
  -- ============================================
  SELECT role, branch_id INTO v_role, v_my_branch 
  FROM public.user_roles 
  WHERE user_id = auth.uid();

  IF v_role = 'verifier' AND v_my_branch IS DISTINCT FROM p_branch THEN
    RAISE EXCEPTION 'Verificador solo puede procesar check-ins de su sucursal';
  END IF;

  -- ============================================
  -- 3. VERIFICAR LÍMITE DE CHECK-INS DIARIOS
  -- ============================================
  SELECT COUNT(*) INTO v_existing_checkins
  FROM public.check_ins 
  WHERE user_id = p_user AND check_in_date = CURRENT_DATE;

  IF v_existing_checkins >= v_max_checkins_daily THEN
    RAISE EXCEPTION 'Has alcanzado el límite de check-ins diarios (%)', v_max_checkins_daily;
  END IF;

  -- ============================================
  -- 4. INSERTAR CHECK-IN (RESTAURADO)
  -- ============================================
  INSERT INTO public.check_ins(user_id, branch_id, verified_by, check_in_date, spins_earned, created_at)
  VALUES (p_user, p_branch, auth.uid(), CURRENT_DATE, v_final_spins, NOW());

  -- ============================================
  -- 5. ACTUALIZAR GIROS DISPONIBLES (RESTAURADO)
  -- ============================================
  INSERT INTO public.user_spins(user_id, available_spins, updated_at)
  VALUES (p_user, v_final_spins, NOW())
  ON CONFLICT (user_id) DO UPDATE SET 
    available_spins = user_spins.available_spins + v_final_spins,
    updated_at = NOW();

  -- ============================================
  -- 6. OBTENER THRESHOLD MÁXIMO CONFIGURADO
  -- ============================================
  SELECT MAX(streak_threshold) INTO v_max_threshold
  FROM public.prizes 
  WHERE type = 'streak' 
    AND is_active = true 
    AND (deleted_at IS NULL)
    AND streak_threshold IS NOT NULL;

  -- ============================================
  -- 7. VERIFICAR ESTADO ACTUAL DE LA RACHA
  -- ============================================
  SELECT current_count, expires_at, created_at, last_check_in, is_just_completed
  INTO v_new_current_count, v_previous_expires_at, v_streak_created_at, v_last_checkin_date, v_was_just_completed
  FROM public.streaks 
  WHERE user_id = p_user;

  -- Convertir last_check_in a fecha para comparación
  v_last_checkin_date := v_streak_created_at::date;

  -- Verificar si la racha ha expirado (temporada completa)
  IF v_previous_expires_at IS NOT NULL AND v_previous_expires_at < NOW() THEN
    v_streak_expired := true;
  END IF;

  -- Verificar si la racha se rompió por inactividad
  IF v_streak_created_at IS NOT NULL THEN
    IF (CURRENT_DATE - v_last_checkin_date) > v_break_days THEN
      v_streak_broken := true;
    END IF;
  END IF;

  -- ============================================
  -- 8. ACTUALIZAR/CREAR RACHA CON LÓGICA CORREGIDA
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
    -- 🔥 LÓGICA CORREGIDA: Mantener streak en último threshold
    current_count = CASE
      -- Si estaba "recién completada", iniciar nueva racha en 1
      WHEN v_was_just_completed = true THEN 1
      -- Racha expirada: Nueva temporada desde 1
      WHEN v_streak_expired THEN 1
      -- Racha rota: Volver a 1  
      WHEN v_streak_broken THEN 1
      -- Último check-in fue ayer: Continuar racha incrementando
      WHEN v_last_checkin_date = CURRENT_DATE - INTERVAL '1 day' THEN 
        v_new_current_count + 1
      -- Último check-in fue hoy Y permite múltiples: INCREMENTAR
      WHEN v_last_checkin_date = CURRENT_DATE AND v_max_checkins_daily > 1 THEN 
        v_new_current_count + 1
      -- Último check-in fue hoy pero solo 1 por día: MANTENER
      WHEN v_last_checkin_date = CURRENT_DATE THEN 
        v_new_current_count
      -- Primer check-in del usuario: Iniciar en 1
      ELSE 1
    END,
    
    -- Reset flag de recién completada
    is_just_completed = false,
    
    -- Actualizar max_count
    max_count = CASE 
      -- Si fue recién completada, expirada o rota: max_count mínimo 1
      WHEN v_was_just_completed = true OR v_streak_expired OR v_streak_broken THEN 
        GREATEST(streaks.max_count, 1)
      -- Último check-in fue ayer: actualizar con nueva cuenta
      WHEN v_last_checkin_date = CURRENT_DATE - INTERVAL '1 day' THEN 
        GREATEST(streaks.max_count, v_new_current_count + 1)
      -- Hoy con múltiples check-ins permitidos: actualizar máximo
      WHEN v_last_checkin_date = CURRENT_DATE AND v_max_checkins_daily > 1 THEN 
        GREATEST(streaks.max_count, v_new_current_count + 1)
      -- Otros casos: mantener el máximo
      ELSE 
        GREATEST(streaks.max_count, v_new_current_count)
    END,
    
    -- Recalcular expires_at para nueva temporada si expiró
    expires_at = CASE
      WHEN v_streak_expired THEN NOW() + (v_expiry_days || ' days')::INTERVAL
      ELSE streaks.expires_at
    END,
    
    last_check_in = NOW(),
    updated_at = NOW();

  -- ============================================
  -- 9. OBTENER CURRENT_COUNT ACTUALIZADO
  -- ============================================
  SELECT current_count INTO v_new_current_count
  FROM public.streaks 
  WHERE user_id = p_user;

  -- ============================================
  -- 10. GENERAR CUPONES AUTOMÁTICOS POR THRESHOLD
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
  -- 11. VERIFICAR COMPLETACIÓN DE RACHA MÁXIMA (CORREGIDO)
  -- ============================================
  IF v_max_threshold IS NOT NULL AND v_new_current_count >= v_max_threshold THEN
    -- 🎯 MANTENER EN ÚLTIMO THRESHOLD (CAMBIO DE 027)
    UPDATE public.streaks 
    SET 
      completed_count = completed_count + 1,
      current_count = v_max_threshold,  -- Mantener en último threshold
      is_just_completed = true,  -- Flag para UI temporal
      updated_at = NOW()
    WHERE user_id = p_user;
    
    RAISE NOTICE 'Racha completada para usuario %: contador mantenido en threshold máximo %', 
      p_user, v_max_threshold;
  END IF;

END;
$$;

-- ============================================
-- COMENTARIOS Y VALIDACIONES FINALES
-- ============================================

COMMENT ON FUNCTION public.process_checkin(uuid, uuid, int) IS 
'Función de check-in CORREGIDA: usa get_system_setting() y mantiene contador en último threshold';

-- Verificar que la función se actualizó correctamente
DO $$ 
BEGIN 
  RAISE NOTICE 'Función process_checkin CORREGIDA: system_settings query arreglado + streak completion mantiene último threshold';
END $$;