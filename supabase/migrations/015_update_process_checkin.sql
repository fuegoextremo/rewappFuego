-- Migración para actualizar process_checkin con lógica completa de rachas
-- Fecha: 2025-09-09
-- Propósito: Integrar generación automática de cupones y manejo avanzado de rachas

-- ============================================
-- FUNCIÓN PRINCIPAL: process_checkin MEJORADA
-- ============================================

CREATE OR REPLACE FUNCTION public.process_checkin(p_user uuid, p_branch uuid, p_spins int DEFAULT NULL)
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
  v_new_current_count int;
  v_previous_expires_at timestamp with time zone;
  v_streak_created_at timestamp with time zone;
  v_streak_expired boolean := false;
  v_streak_broken boolean := false;
  v_is_racha_completada boolean := false;
  v_prize_record RECORD;
BEGIN
  -- ============================================
  -- 1. OBTENER CONFIGURACIONES DINÁMICAS
  -- ============================================
  v_final_spins := COALESCE(p_spins, get_system_setting('checkin_points_daily', '1')::int);
  v_max_checkins_daily := get_system_setting('max_checkins_per_day', '1')::int;
  v_expiry_days := get_system_setting('streak_expiry_days', '90')::int;
  v_break_days := get_system_setting('streak_break_days', '1')::int;

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

  -- Verificar límite de check-ins diarios
  SELECT COUNT(*) INTO v_existing_checkins
  FROM public.check_ins 
  WHERE user_id = p_user AND check_in_date = CURRENT_DATE;

  IF v_existing_checkins >= v_max_checkins_daily THEN
    RAISE EXCEPTION 'Has alcanzado el límite de check-ins diarios (%)', v_max_checkins_daily;
  END IF;

  -- ============================================
  -- 3. INSERTAR CHECK-IN
  -- ============================================
  INSERT INTO public.check_ins(user_id, branch_id, verified_by, check_in_date, spins_earned, created_at)
  VALUES (p_user, p_branch, auth.uid(), CURRENT_DATE, v_final_spins, NOW());

  -- ============================================
  -- 4. ACTUALIZAR GIROS DISPONIBLES
  -- ============================================
  INSERT INTO public.user_spins(user_id, available_spins, updated_at)
  VALUES (p_user, v_final_spins, NOW())
  ON CONFLICT (user_id) DO UPDATE SET 
    available_spins = user_spins.available_spins + v_final_spins,
    updated_at = NOW();

  -- ============================================
  -- 5. LÓGICA AVANZADA DE RACHAS
  -- ============================================
  
  -- Obtener datos actuales de la racha
  SELECT current_count, expires_at, created_at, last_check_in
  INTO v_new_current_count, v_previous_expires_at, v_streak_created_at, v_streak_created_at
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

  -- Actualizar/Crear racha con lógica completa
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
    -- 🔥 CORRECCIÓN: Calcular current_count PRIMERO, ANTES de resetear flags
    current_count = CASE
      -- Si fue recién completada, empezar nueva racha desde 1
      WHEN streaks.is_just_completed = true THEN 1
      -- Racha expirada: Nueva temporada desde 1
      WHEN v_streak_expired THEN 1
      -- Racha rota: Reiniciar desde 1  
      WHEN v_streak_broken THEN 1
      -- Último check-in fue ayer: Continuar racha
      WHEN streaks.last_check_in::date = CURRENT_DATE - INTERVAL '1 day' THEN 
        streaks.current_count + 1
      -- Último check-in fue hoy: Mantener cuenta (múltiples check-ins)
      WHEN streaks.last_check_in::date = CURRENT_DATE THEN 
        streaks.current_count
      -- Otros casos: Reiniciar
      ELSE 1
    END,
    
    -- 🔥 CORRECCIÓN: Resetear flag DESPUÉS de calcular current_count
    is_just_completed = false,
    
    -- Actualizar max_count si es necesario
    max_count = CASE 
      -- Si fue recién completada, expirada o rota: max_count no menor que 1
      WHEN streaks.is_just_completed = true OR v_streak_expired OR v_streak_broken THEN 
        GREATEST(streaks.max_count, 1)
      -- Último check-in fue ayer: actualizar con nueva cuenta
      WHEN streaks.last_check_in::date = CURRENT_DATE - INTERVAL '1 day' THEN 
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
  -- 6. OBTENER NUEVO CURRENT_COUNT PARA GENERAR CUPONES
  -- ============================================
  SELECT current_count INTO v_new_current_count
  FROM public.streaks 
  WHERE user_id = p_user;

  -- ============================================
  -- 7. GENERAR CUPONES AUTOMÁTICOS POR THRESHOLD
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
  -- 8. VERIFICAR COMPLETACIÓN DE RACHA MÁXIMA
  -- ============================================
  SELECT check_streak_completion(p_user, v_new_current_count) INTO v_is_racha_completada;
  
  IF v_is_racha_completada THEN
    RAISE NOTICE 'Racha completada para usuario %: % visitas alcanzadas', p_user, v_new_current_count;
  END IF;

END;
$$;

-- ============================================
-- COMENTARIOS Y VALIDACIONES FINALES
-- ============================================

COMMENT ON FUNCTION public.process_checkin(uuid, uuid, int) IS 
'Función principal de check-in con generación automática de cupones y manejo avanzado de rachas completadas';

-- Verificar que la función se creó correctamente
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'process_checkin'
  ) THEN 
    RAISE EXCEPTION 'Error: Función process_checkin no se actualizó correctamente';
  END IF;
  
  RAISE NOTICE 'Función process_checkin actualizada exitosamente con lógica de rachas completadas';
END $$;
