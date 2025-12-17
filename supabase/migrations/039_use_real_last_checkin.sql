-- ============================================
-- MIGRACION 039: Usar ultimo check-in REAL para calculo de racha rota
-- ============================================
-- Problema: v_streak_broken se calculaba usando last_check_in de streaks,
-- pero deberia usar el ultimo check-in REAL de la tabla check_ins.
-- Esto es consistente con el fix de 038 para incremento.

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
  v_was_just_completed boolean := false;
  v_streak_expired boolean := false;
  v_streak_broken boolean := false;
  v_prize_record RECORD;
  v_should_increment boolean := false;
  v_real_last_checkin_date date;  -- NUEVO: ultimo check-in REAL
BEGIN
  -- ============================================
  -- 1. CARGAR CONFIGURACION SISTEMA
  -- ============================================
  v_final_spins := COALESCE(p_spins, get_system_setting('checkin_points_daily', '1')::int);
  v_max_checkins_daily := get_system_setting('max_checkins_per_day', '1')::int;
  v_expiry_days := get_system_setting('streak_expiry_days', '90')::int;
  v_break_days := get_system_setting('streak_break_days', '12')::int;

  -- ============================================
  -- 2. VALIDACIONES DE SEGURIDAD
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
  -- 3. CONTAR CHECK-INS DE HOY (ANTES de insertar)
  -- ============================================
  SELECT COUNT(*) INTO v_existing_checkins
  FROM public.check_ins 
  WHERE user_id = p_user AND check_in_date = CURRENT_DATE;

  IF v_existing_checkins >= v_max_checkins_daily THEN
    RAISE EXCEPTION 'Has alcanzado el limite de check-ins diarios (%)', v_max_checkins_daily;
  END IF;

  -- ============================================
  -- 4. OBTENER ULTIMO CHECK-IN REAL (de tabla check_ins)
  -- ============================================
  SELECT check_in_date INTO v_real_last_checkin_date
  FROM public.check_ins
  WHERE user_id = p_user
  ORDER BY created_at DESC
  LIMIT 1;

  -- ============================================
  -- 5. INSERTAR CHECK-IN
  -- ============================================
  INSERT INTO public.check_ins(user_id, branch_id, verified_by, check_in_date, spins_earned, created_at)
  VALUES (p_user, p_branch, auth.uid(), CURRENT_DATE, v_final_spins, NOW());

  -- ============================================
  -- 6. ACTUALIZAR GIROS DISPONIBLES
  -- ============================================
  INSERT INTO public.user_spins(user_id, available_spins, updated_at)
  VALUES (p_user, v_final_spins, NOW())
  ON CONFLICT (user_id) DO UPDATE SET 
    available_spins = user_spins.available_spins + v_final_spins,
    updated_at = NOW();

  -- ============================================
  -- 7. OBTENER THRESHOLD MAXIMO CONFIGURADO
  -- ============================================
  SELECT MAX(streak_threshold) INTO v_max_threshold
  FROM public.prizes 
  WHERE type = 'streak' 
    AND is_active = true 
    AND (deleted_at IS NULL)
    AND streak_threshold IS NOT NULL;

  -- ============================================
  -- 8. VERIFICAR ESTADO ACTUAL DE LA RACHA
  -- ============================================
  SELECT current_count, expires_at, created_at, is_just_completed
  INTO v_new_current_count, v_previous_expires_at, v_streak_created_at, v_was_just_completed
  FROM public.streaks 
  WHERE user_id = p_user;

  -- Verificar si la racha ha expirado (temporada completa)
  IF v_previous_expires_at IS NOT NULL AND v_previous_expires_at < NOW() THEN
    v_streak_expired := true;
  END IF;

  -- CORREGIDO: Usar ultimo check-in REAL para calcular si la racha se rompio
  IF v_streak_created_at IS NOT NULL AND v_real_last_checkin_date IS NOT NULL THEN
    IF (CURRENT_DATE - v_real_last_checkin_date) > v_break_days THEN
      v_streak_broken := true;
    END IF;
  END IF;

  -- ============================================
  -- 9. DETERMINAR SI DEBE INCREMENTAR
  -- ============================================
  IF v_existing_checkins = 0 THEN
    v_should_increment := true;
  ELSIF v_max_checkins_daily > 1 THEN
    v_should_increment := true;
  ELSE
    v_should_increment := false;
  END IF;

  -- ============================================
  -- 10. ACTUALIZAR/CREAR RACHA
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
      WHEN streaks.is_just_completed = true THEN 1
      WHEN v_streak_expired THEN 0
      WHEN v_streak_broken THEN 1
      WHEN v_should_increment THEN streaks.current_count + 1
      ELSE streaks.current_count
    END,
    
    is_just_completed = false,
    
    max_count = CASE 
      WHEN streaks.is_just_completed = true OR v_streak_expired OR v_streak_broken THEN 
        GREATEST(streaks.max_count, 0)
      WHEN v_should_increment THEN 
        GREATEST(streaks.max_count, streaks.current_count + 1)
      ELSE 
        GREATEST(streaks.max_count, streaks.current_count)
    END,
    
    expires_at = CASE
      WHEN v_streak_expired THEN NOW() + (v_expiry_days || ' days')::INTERVAL
      ELSE streaks.expires_at
    END,
    
    -- last_check_in es solo INFORMATIVO, se actualiza pero no se usa para decisiones
    last_check_in = NOW(),
    updated_at = NOW();

  -- ============================================
  -- 11. OBTENER CURRENT_COUNT ACTUALIZADO
  -- ============================================
  SELECT current_count INTO v_new_current_count
  FROM public.streaks 
  WHERE user_id = p_user;

  -- ============================================
  -- 12. GENERAR CUPONES AUTOMATICOS POR THRESHOLD
  -- ============================================
  FOR v_prize_record IN 
    SELECT id, streak_threshold, validity_days, name
    FROM public.prizes 
    WHERE type = 'streak' 
      AND is_active = true 
      AND streak_threshold = v_new_current_count
      AND (deleted_at IS NULL)
  LOOP
    PERFORM public.grant_manual_coupon(
      p_user, 
      v_prize_record.id, 
      COALESCE(v_prize_record.validity_days, 30)
    );
    
    RAISE NOTICE 'Cupon automatico generado: Usuario %, Premio "%" por racha %', 
      p_user, v_prize_record.name, v_prize_record.streak_threshold;
  END LOOP;

  -- ============================================
  -- 13. VERIFICAR COMPLETACION DE RACHA MAXIMA
  -- ============================================
  IF v_max_threshold IS NOT NULL AND v_new_current_count >= v_max_threshold THEN
    UPDATE public.streaks 
    SET 
      completed_count = completed_count + 1,
      current_count = v_max_threshold,
      is_just_completed = true,
      updated_at = NOW()
    WHERE user_id = p_user;
    
    RAISE NOTICE 'Racha completada para usuario %: % visitas alcanzadas', 
      p_user, v_new_current_count;
  END IF;

END;
$$;

COMMENT ON FUNCTION public.process_checkin(uuid, uuid, int) IS 
'Funcion de check-in CORREGIDA v2: usa check_ins reales para incremento Y para calculo de racha rota. last_check_in en streaks es solo informativo.';
