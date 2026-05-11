-- ============================================
-- MIGRACIÓN 042: Fix Race Conditions en spin_roulette
-- ============================================
-- Problemas corregidos:
-- 1. Race condition TOCTOU: SELECT de spins y UPDATE estaban separados.
--    Dos requests concurrentes podían consumir el mismo spin dos veces.
-- 2. Race condition de inventario: el cupón se creaba antes de reservar
--    el stock. Dos usuarios podían ganar el mismo premio con inventory = 1.
-- 3. Premios soft-deleted (deleted_at IS NOT NULL) no eran filtrados.
-- 4. roulette_win_percentage sin clamping: un valor > 100 hace que
--    RANDOM() < prob sea siempre true, garantizando premio en cada giro.

CREATE OR REPLACE FUNCTION public.spin_roulette(p_user uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spins_remaining int;
  v_prize_id uuid;
  v_prize_name text;
  v_coupon_id uuid;
  v_won boolean := false;
  v_win_probability float;
  v_expiry_days int;
  v_total_weight int;
  v_random_value int;
  v_claimed_prize_id uuid;
  v_execution_time timestamp := NOW();
BEGIN
  -- Configuraciones dinámicas con clamping de seguridad [0.0, 1.0].
  -- Sin clamping un admin puede escribir '200' y garantizar premio en cada giro.
  v_win_probability := LEAST(
    GREATEST(
      (get_system_setting('roulette_win_percentage', '15')::float) / 100.0,
      0.0
    ),
    1.0
  );
  v_expiry_days := get_system_setting('default_coupon_expiry_days', '30')::int;

  -- CORRECCIÓN 1: Descuento atómico del spin.
  -- Un único UPDATE condicional reemplaza el SELECT + UPDATE separado (TOCTOU).
  -- Si available_spins = 0, ninguna fila se actualiza y v_spins_remaining = NULL.
  -- Dos requests concurrentes con available_spins = 1 solo pueden decrementar una vez.
  UPDATE public.user_spins
  SET available_spins = available_spins - 1,
      updated_at = NOW()
  WHERE user_id = p_user AND available_spins > 0
  RETURNING available_spins INTO v_spins_remaining;

  IF v_spins_remaining IS NULL THEN
    RETURN json_build_object('won', false, 'reason', 'no_spins');
  END IF;

  -- Determinar si gana
  IF RANDOM() < v_win_probability THEN
    -- CORRECCIÓN 3: filtrar deleted_at IS NULL para respetar soft-delete.
    SELECT COALESCE(SUM(COALESCE(weight, 1)), 0) INTO v_total_weight
    FROM public.prizes
    WHERE is_active = true
      AND inventory_count > 0
      AND type = 'roulette'
      AND deleted_at IS NULL;

    IF v_total_weight > 0 THEN
      v_random_value := FLOOR(RANDOM() * v_total_weight) + 1;

      -- Selección proporcional por pesos con orden MD5+timestamp
      -- (evita la reutilización de plan de ORDER BY RANDOM(), documentada en migración 026)
      WITH ordered_prizes AS (
        SELECT
          id,
          name,
          COALESCE(weight, 1) AS prize_weight,
          SUM(COALESCE(weight, 1)) OVER (
            ORDER BY MD5(id::text || v_execution_time::text)::uuid
          ) AS cumulative_weight
        FROM public.prizes
        WHERE is_active = true
          AND inventory_count > 0
          AND type = 'roulette'
          AND deleted_at IS NULL
      )
      SELECT id, name INTO v_prize_id, v_prize_name
      FROM ordered_prizes
      WHERE cumulative_weight >= v_random_value
      ORDER BY cumulative_weight
      LIMIT 1;

      IF v_prize_id IS NOT NULL THEN
        -- CORRECCIÓN 2: Reservar inventario ANTES de crear el cupón.
        -- AND inventory_count > 0 es atómico a nivel de fila.
        -- Si dos usuarios ganan el mismo premio con inventory = 1,
        -- solo uno obtiene RETURNING; el otro recibe NULL y no gana.
        UPDATE public.prizes
        SET inventory_count = inventory_count - 1
        WHERE id = v_prize_id AND inventory_count > 0
        RETURNING id INTO v_claimed_prize_id;

        IF v_claimed_prize_id IS NOT NULL THEN
          v_won := true;
          INSERT INTO public.coupons(user_id, prize_id, expires_at, source, created_at)
          VALUES (p_user, v_prize_id, NOW() + (v_expiry_days || ' days')::interval, 'roulette', NOW())
          RETURNING id INTO v_coupon_id;
        ELSE
          -- Inventario agotado entre selección y reserva: no se otorga premio
          v_prize_id := NULL;
          v_prize_name := NULL;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Registrar giro en historial (siempre, independientemente del resultado)
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
