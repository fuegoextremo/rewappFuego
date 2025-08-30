-- Migración para aplicar correcciones finales a process_checkin
-- Fecha: 2025-08-29

-- Actualizar función process_checkin con lógica corregida:
-- 1. Usar la clave correcta 'max_checkins_per_day'
-- 2. Permitir múltiples check-ins por día según configuración  
-- 3. Actualizar racha con cada check-in válido

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
BEGIN
  -- Obtener configuraciones dinámicas (CORREGIDO: usar 'max_checkins_per_day')
  v_final_spins := COALESCE(p_spins, get_system_setting('checkin_points_daily', '1')::int);
  v_max_checkins_daily := get_system_setting('max_checkins_per_day', '1')::int;

  -- Validar autenticación
  SELECT role, branch_id INTO v_role, v_my_branch
  FROM public.user_profiles WHERE id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificador solo puede procesar su sucursal
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

  -- ELIMINADA la validación redundante que impedía múltiples check-ins

  -- Insertar check-in
  INSERT INTO public.check_ins(user_id, branch_id, verified_by, check_in_date, spins_earned, created_at)
  VALUES (p_user, p_branch, auth.uid(), CURRENT_DATE, v_final_spins, NOW());

  -- Actualizar giros disponibles con configuración dinámica
  INSERT INTO public.user_spins(user_id, available_spins, updated_at)
  VALUES (p_user, v_final_spins, NOW())
  ON CONFLICT (user_id) DO UPDATE SET 
    available_spins = user_spins.available_spins + v_final_spins,
    updated_at = NOW();

  -- Actualizar racha con cada check-in válido
  INSERT INTO public.streaks(user_id, current_count, max_count, last_check_in, created_at, updated_at)
  VALUES (p_user, 1, 1, NOW(), NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_count = CASE
      -- Si el último check-in fue ayer, continuar la racha
      WHEN streaks.last_check_in::date = CURRENT_DATE - INTERVAL '1 day' THEN 
        streaks.current_count + 1
      -- Si el último check-in fue hoy, continuar la racha (múltiples check-ins por día)
      WHEN streaks.last_check_in::date = CURRENT_DATE THEN 
        streaks.current_count + 1
      -- Si fue hace más de 1 día, reiniciar la racha
      ELSE 1
    END,
    max_count = CASE 
      WHEN streaks.last_check_in::date >= CURRENT_DATE - INTERVAL '1 day' THEN 
        GREATEST(streaks.max_count, streaks.current_count + 1)
      ELSE GREATEST(streaks.max_count, 1)
    END,
    last_check_in = NOW(),
    updated_at = NOW();

END;
$$;
