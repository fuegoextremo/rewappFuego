-- Migration 006: Integrar system_settings con funciones existentes
-- Fecha: 2025-08-28
-- Propósito: Reemplazar valores hardcodeados con configuraciones dinámicas

-- ============================================
-- 1. FUNCIÓN AUXILIAR PARA OBTENER CONFIGURACIONES
-- ============================================

CREATE OR REPLACE FUNCTION get_system_setting(setting_key text, default_value text DEFAULT '0')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_value text;
BEGIN
  SELECT value INTO setting_value
  FROM system_settings
  WHERE key = setting_key AND is_active = true
  LIMIT 1;
  
  RETURN COALESCE(setting_value, default_value);
END;
$$;

-- ============================================
-- 2. ACTUALIZAR FUNCIÓN spin_roulette CON CONFIGURACIONES DINÁMICAS
-- ============================================

CREATE OR REPLACE FUNCTION public.spin_roulette(p_user uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spins int;
  v_prize_id uuid;
  v_prize_name text;
  v_coupon_id uuid;
  v_won boolean := false;
  v_win_probability float;
  v_expiry_days int;
  v_total_weight int;
  v_random_value int;
BEGIN
  -- Obtener configuraciones dinámicas
  v_win_probability := (get_system_setting('roulette_win_percentage', '15')::float) / 100.0;
  v_expiry_days := get_system_setting('default_coupon_expiry_days', '30')::int;

  -- Verificar que el usuario tiene giros disponibles
  SELECT available_spins INTO v_spins
  FROM public.user_spins
  WHERE user_id = p_user;

  IF COALESCE(v_spins,0) <= 0 THEN
    RETURN json_build_object('won', false, 'reason', 'no_spins');
  END IF;

  -- Determinar si gana (probabilidad configurada)
  IF RANDOM() < v_win_probability THEN
    -- Calcular peso total de premios disponibles
    SELECT COALESCE(SUM(COALESCE(weight,1)), 0) INTO v_total_weight
    FROM public.prizes
    WHERE is_active = true AND inventory_count > 0 AND type = 'roulette';

    IF v_total_weight > 0 THEN
      -- Generar número random basado en peso total
      v_random_value := FLOOR(RANDOM() * v_total_weight) + 1;

      -- Seleccionar premio usando selección proporcional correcta
      WITH weighted_prizes AS (
        SELECT id, name, COALESCE(weight,1) AS w,
               SUM(COALESCE(weight,1)) OVER (ORDER BY id) AS cumulative_weight
        FROM public.prizes
        WHERE is_active = true AND inventory_count > 0 AND type = 'roulette'
      )
      SELECT id, name INTO v_prize_id, v_prize_name
      FROM weighted_prizes
      WHERE cumulative_weight >= v_random_value
      ORDER BY cumulative_weight
      LIMIT 1;

      IF v_prize_id IS NOT NULL THEN
        v_won := true;

        -- Crear cupón con expiración configurada
        INSERT INTO public.coupons(user_id, prize_id, expires_at, source, created_at)
        VALUES (p_user, v_prize_id, NOW() + (v_expiry_days || ' days')::interval, 'roulette', NOW())
        RETURNING id INTO v_coupon_id;

        -- Decrementar inventario (con protección)
        UPDATE public.prizes
        SET inventory_count = GREATEST(inventory_count - 1, 0)
        WHERE id = v_prize_id AND inventory_count > 0;
      END IF;
    END IF;
  END IF;

  -- Descontar giro
  UPDATE public.user_spins
  SET available_spins = GREATEST(available_spins - 1, 0),
      updated_at = NOW()
  WHERE user_id = p_user;

  -- Registrar giro en historial
  INSERT INTO public.roulette_spins(user_id, prize_id, coupon_id, won_prize, created_at)
  VALUES (p_user, v_prize_id, v_coupon_id, v_won, NOW());

  RETURN json_build_object(
    'won', v_won,
    'prize_id', v_prize_id,
    'prize_name', v_prize_name,
    'coupon_id', v_coupon_id,
    'win_probability', v_win_probability,
    'expiry_days', v_expiry_days
  );
END;
$$;

-- ============================================
-- 3. ACTUALIZAR FUNCIÓN process_checkin CON PUNTOS DINÁMICOS
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
BEGIN
  -- Obtener configuraciones dinámicas
  v_final_spins := COALESCE(p_spins, get_system_setting('checkin_points_daily', '1')::int);
  v_max_checkins_daily := get_system_setting('max_checkins_daily', '3')::int;

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

  IF v_existing_checkins > 0 THEN
    RAISE EXCEPTION 'El usuario ya realizó check-in hoy';
  END IF;

  -- Insertar check-in
  INSERT INTO public.check_ins(user_id, branch_id, verified_by, check_in_date, spins_earned, created_at)
  VALUES (p_user, p_branch, auth.uid(), CURRENT_DATE, v_final_spins, NOW());

  -- Actualizar giros disponibles con configuración dinámica
  INSERT INTO public.user_spins(user_id, available_spins, updated_at)
  VALUES (p_user, v_final_spins, NOW())
  ON CONFLICT (user_id) DO UPDATE SET 
    available_spins = user_spins.available_spins + v_final_spins,
    updated_at = NOW();

  -- Actualizar racha
  INSERT INTO public.streaks(user_id, current_streak, best_streak, last_checkin, created_at, updated_at)
  VALUES (p_user, 1, 1, CURRENT_DATE, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN streaks.last_checkin = CURRENT_DATE - INTERVAL '1 day' THEN streaks.current_streak + 1
      ELSE 1
    END,
    best_streak = GREATEST(streaks.best_streak, CASE
      WHEN streaks.last_checkin = CURRENT_DATE - INTERVAL '1 day' THEN streaks.current_streak + 1
      ELSE 1
    END),
    last_checkin = CURRENT_DATE,
    updated_at = NOW();
END;
$$;

-- ============================================
-- 4. FUNCIÓN PARA VALIDAR LIMITES DE PREMIOS
-- ============================================

CREATE OR REPLACE FUNCTION validate_prize_limits()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_prizes int;
  v_current_count int;
BEGIN
  -- Obtener límite configurado
  v_max_prizes := get_system_setting('max_prizes_per_company', '50')::int;
  
  -- Contar premios activos
  SELECT COUNT(*) INTO v_current_count
  FROM public.prizes
  WHERE is_active = true;
  
  RETURN v_current_count < v_max_prizes;
END;
$$;

-- ============================================
-- 5. TRIGGER PARA VALIDAR LÍMITES AL CREAR PREMIOS
-- ============================================

CREATE OR REPLACE FUNCTION check_prize_limit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    IF NOT validate_prize_limits() THEN
      RAISE EXCEPTION 'Se ha alcanzado el límite máximo de premios por empresa';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS prize_limit_check ON public.prizes;
CREATE TRIGGER prize_limit_check
  BEFORE INSERT OR UPDATE ON public.prizes
  FOR EACH ROW
  EXECUTE FUNCTION check_prize_limit_trigger();

-- ============================================
-- 6. COMENTARIOS Y LOGS
-- ============================================

COMMENT ON FUNCTION get_system_setting(text, text) IS 'Obtiene configuraciones del sistema desde system_settings';
COMMENT ON FUNCTION validate_prize_limits() IS 'Valida si se puede crear un nuevo premio según límites configurados';
COMMENT ON FUNCTION check_prize_limit_trigger() IS 'Trigger para validar límites de premios al crear/actualizar';
