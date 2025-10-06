-- ============================================
-- MIGRACIÓN 030: Ajustar configuración de racha rota
-- ============================================
-- Cambios mínimos respecto a migración 029:
-- 1. Cambiar default de streak_break_days: '1' → '12'
-- 2. Cuando racha se rompe, resetear a 1 (no a 0) para permitir mostrar imagen "rota" en frontend

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
  v_role text;
  v_my_branch uuid;
  v_existing_checkins int;
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
  -- 1. CARGAR CONFIGURACIÓN SISTEMA
  -- ============================================
  v_final_spins := COALESCE(p_spins, get_system_setting('checkin_points_daily', '1')::int);
  v_max_checkins_daily := get_system_setting('max_checkins_per_day', '1')::int;
  v_expiry_days := get_system_setting('streak_expiry_days', '90')::int;
  v_break_days := get_system_setting('streak_break_days', '12')::int; -- ✅ CAMBIO 1: '1' → '12'

  -- ============================================
  -- 2. VALIDACIONES DE SEGURIDAD (COMO EN 017)
  -- ============================================
  SELECT role, branch_id INTO v_role, v_my_branch
  FROM public.user_profiles WHERE id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

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
  -- 4. INSERTAR CHECK-IN
  -- ============================================
  INSERT INTO public.check_ins(user_id, branch_id, verified_by, check_in_date, spins_earned, created_at)
  VALUES (p_user, p_branch, auth.uid(), CURRENT_DATE, v_final_spins, NOW());

  -- ============================================
  -- 5. ACTUALIZAR GIROS DISPONIBLES
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

  -- Convertir last_check_in a fecha para comparación (CORREGIDO)
  v_last_checkin_date := v_last_checkin_date::date;

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
    current_count = CASE
      -- Si estaba "recién completada", iniciar nueva racha en 1
      WHEN streaks.is_just_completed = true THEN 1
      -- Racha expirada: Nueva temporada desde 0
      WHEN v_streak_expired THEN 0
      -- ✅ CAMBIO 2: Racha rota resetea a 1 (era 0) para mostrar imagen "rota"
      WHEN v_streak_broken THEN 1
      -- Último check-in fue ayer: Continuar racha incrementando
      WHEN streaks.last_check_in::date = CURRENT_DATE - INTERVAL '1 day' THEN 
        streaks.current_count + 1
      -- Último check-in fue hoy Y permite múltiples check-ins: INCREMENTAR
      WHEN streaks.last_check_in::date = CURRENT_DATE AND v_max_checkins_daily > 1 THEN 
        streaks.current_count + 1
      -- Último check-in fue hoy pero solo permite 1 check-in: mantener
      WHEN streaks.last_check_in::date = CURRENT_DATE AND v_max_checkins_daily = 1 THEN 
        streaks.current_count
      -- Otros casos: Reiniciar
      ELSE 1
    END,
    
    -- Resetear flag de "recién completada" siempre
    is_just_completed = false,
    
    -- Actualizar max_count considerando incrementos múltiples
    max_count = CASE 
      -- Si fue recién completada, expirada o rota: max_count no menor que actual
      WHEN streaks.is_just_completed = true OR v_streak_expired OR v_streak_broken THEN 
        GREATEST(streaks.max_count, 0)
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
  -- 11. VERIFICAR COMPLETACIÓN DE RACHA MÁXIMA
  -- ============================================
  IF v_max_threshold IS NOT NULL AND v_new_current_count >= v_max_threshold THEN
    UPDATE public.streaks 
    SET 
      completed_count = completed_count + 1,
      current_count = v_max_threshold,
      is_just_completed = true,
      updated_at = NOW()
    WHERE user_id = p_user;
    
    RAISE NOTICE 'Racha completada para usuario %: % visitas alcanzadas, contador mantenido en: %', 
      p_user, v_new_current_count, v_max_threshold;
  END IF;

END;
$$;

COMMENT ON FUNCTION public.process_checkin(uuid, uuid, int) IS 
'Función de check-in con ajustes de racha rota: break_days=12 y reseteo a 1 (no 0)';
