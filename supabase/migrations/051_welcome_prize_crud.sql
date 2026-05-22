-- ============================================================
-- MIGRACIÓN 051: CRUD de premios de bienvenida
-- ============================================================
-- Cambios:
--   1. Elimina welcome_coupon_title / description / internal_prize_id
--      (añadidas en 050, reemplazadas por el enfoque CRUD)
--   2. Restaura welcome_coupon_prize_id como selector del premio activo
--   3. Actualiza RPC para leer welcome_coupon_prize_id
-- El CHECK constraint prizes_type_check con 'welcome' se conserva de 050.
-- Los premios type='welcome' usan soft-delete (is_active = false).
-- ============================================================

-- 1. LIMPIAR SETTINGS DE 050 Y RESTAURAR prize_id
DELETE FROM public.system_settings
WHERE key IN (
  'welcome_coupon_title',
  'welcome_coupon_description',
  'welcome_coupon_internal_prize_id'
);

INSERT INTO public.system_settings (key, value, description, setting_type, category)
VALUES ('welcome_coupon_prize_id', '', 'UUID del premio de bienvenida seleccionado', 'string', 'general')
ON CONFLICT (key) DO NOTHING;

-- 2. ACTUALIZAR RPC grant_welcome_coupon
CREATE OR REPLACE FUNCTION public.grant_welcome_coupon(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled          TEXT;
  v_prize_id         TEXT;
  v_expiry_mode      TEXT;
  v_expiry_days      INTEGER;
  v_expiry_date      TEXT;
  v_campaign_end     TEXT;
  v_expires_at       TIMESTAMPTZ;
  v_coupon_id        UUID;
  v_already_granted  BOOLEAN;
BEGIN
  SELECT
    MAX(CASE WHEN key = 'welcome_coupon_enabled'    THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_prize_id'   THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_expiry_mode' THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_expiry_days' THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_expiry_date' THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_campaign_end' THEN value END)
  INTO
    v_enabled, v_prize_id, v_expiry_mode, v_expiry_days, v_expiry_date, v_campaign_end
  FROM public.system_settings
  WHERE key IN (
    'welcome_coupon_enabled',
    'welcome_coupon_prize_id',
    'welcome_coupon_expiry_mode',
    'welcome_coupon_expiry_days',
    'welcome_coupon_expiry_date',
    'welcome_coupon_campaign_end'
  );

  IF v_enabled IS DISTINCT FROM 'true' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'feature_disabled');
  END IF;

  IF v_prize_id IS NULL OR trim(v_prize_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_prize_configured');
  END IF;

  IF v_campaign_end IS NOT NULL AND trim(v_campaign_end) <> '' THEN
    IF CURRENT_DATE >= (v_campaign_end::DATE) THEN
      RETURN jsonb_build_object('success', false, 'reason', 'campaign_ended');
    END IF;
  END IF;

  IF v_expiry_mode = 'fixed_date' THEN
    IF v_expiry_date IS NULL OR trim(v_expiry_date) = '' THEN
      RETURN jsonb_build_object('success', false, 'reason', 'no_expiry_date_configured');
    END IF;
    IF CURRENT_DATE >= (v_expiry_date::DATE) THEN
      RETURN jsonb_build_object('success', false, 'reason', 'expiry_date_passed');
    END IF;
  END IF;

  SELECT welcome_coupon_granted INTO v_already_granted
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_already_granted IS TRUE THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_granted');
  END IF;

  IF v_expiry_mode = 'fixed_date' THEN
    v_expires_at := (v_expiry_date::DATE)::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes 59 seconds';
  ELSE
    v_expiry_days := COALESCE(v_expiry_days, 30);
    IF v_expiry_days <= 0 THEN v_expiry_days := 30; END IF;
    v_expires_at := NOW() + (v_expiry_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO public.coupons (
    user_id, prize_id, unique_code, expires_at, source, is_redeemed, created_at
  ) VALUES (
    p_user_id, v_prize_id::UUID, public.generate_coupon_code(),
    v_expires_at, 'welcome', false, NOW()
  )
  RETURNING id INTO v_coupon_id;

  UPDATE public.user_profiles
  SET welcome_coupon_granted = true
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'coupon_id', v_coupon_id);

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
