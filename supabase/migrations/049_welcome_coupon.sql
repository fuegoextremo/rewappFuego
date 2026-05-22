-- ============================================================
-- MIGRACIÓN 049: Cupón de bienvenida configurable
-- ============================================================
-- Agrega:
--   1. Columna welcome_coupon_granted en user_profiles
--   2. Seis claves en system_settings (categoría general)
--   3. Función RPC grant_welcome_coupon(p_user_id UUID)
-- ============================================================

-- 1. COLUMNA EN USER_PROFILES
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS welcome_coupon_granted BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. SYSTEM_SETTINGS
INSERT INTO public.system_settings (key, value, description, setting_type, category) VALUES
  ('welcome_coupon_enabled',      'false', 'Activar cupón de bienvenida al registrarse',                     'boolean', 'general'),
  ('welcome_coupon_prize_id',     '',      'UUID del premio asignado como cupón de bienvenida',               'string',  'general'),
  ('welcome_coupon_expiry_mode',  'days',  'Modo de expiración del cupón: days | fixed_date',                 'string',  'general'),
  ('welcome_coupon_expiry_days',  '30',    'Días de validez del cupón desde el registro (modo days)',         'number',  'general'),
  ('welcome_coupon_expiry_date',  '',      'Fecha fija de expiración del cupón ISO (modo fixed_date)',        'string',  'general'),
  ('welcome_coupon_campaign_end', '',      'Fecha límite para otorgar nuevos cupones de bienvenida ISO',      'string',  'general')
ON CONFLICT (key) DO NOTHING;

-- 3. FUNCIÓN RPC grant_welcome_coupon
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
  -- Leer todas las settings relevantes en una sola consulta
  SELECT
    MAX(CASE WHEN key = 'welcome_coupon_enabled'      THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_prize_id'     THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_expiry_mode'  THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_expiry_days'  THEN value END),
    MAX(CASE WHEN key = 'welcome_coupon_expiry_date'  THEN value END),
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

  -- REQ-003: Feature desactivada
  IF v_enabled IS DISTINCT FROM 'true' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'feature_disabled');
  END IF;

  -- REQ-006: Sin premio configurado
  IF v_prize_id IS NULL OR trim(v_prize_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_prize_configured');
  END IF;

  -- REQ-004: Campaña terminada (campaign_end)
  IF v_campaign_end IS NOT NULL AND trim(v_campaign_end) <> '' THEN
    IF CURRENT_DATE >= (v_campaign_end::DATE) THEN
      RETURN jsonb_build_object('success', false, 'reason', 'campaign_ended');
    END IF;
  END IF;

  -- REQ-004b: fixed_date y la fecha ya pasó → auto-deshabilita sin crear cupón expirado
  IF v_expiry_mode = 'fixed_date' THEN
    IF v_expiry_date IS NULL OR trim(v_expiry_date) = '' THEN
      RETURN jsonb_build_object('success', false, 'reason', 'no_expiry_date_configured');
    END IF;
    IF CURRENT_DATE >= (v_expiry_date::DATE) THEN
      RETURN jsonb_build_object('success', false, 'reason', 'expiry_date_passed');
    END IF;
  END IF;

  -- REQ-005: Ya se otorgó
  SELECT welcome_coupon_granted INTO v_already_granted
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_already_granted IS TRUE THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_granted');
  END IF;

  -- Calcular expires_at según modo
  IF v_expiry_mode = 'fixed_date' THEN
    -- REQ-008: fecha fija (ya verificamos que es futura)
    v_expires_at := (v_expiry_date::DATE)::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes 59 seconds';
  ELSE
    -- REQ-007: días desde ahora (default)
    v_expiry_days := COALESCE(v_expiry_days, 30);
    IF v_expiry_days <= 0 THEN
      v_expiry_days := 30;
    END IF;
    v_expires_at := NOW() + (v_expiry_days || ' days')::INTERVAL;
  END IF;

  -- Insertar cupón con source='welcome'
  INSERT INTO public.coupons (
    user_id,
    prize_id,
    unique_code,
    expires_at,
    source,
    is_redeemed,
    created_at
  ) VALUES (
    p_user_id,
    v_prize_id::UUID,
    public.generate_coupon_code(),
    v_expires_at,
    'welcome',
    false,
    NOW()
  )
  RETURNING id INTO v_coupon_id;

  -- Marcar flag en user_profiles (REQ-002)
  UPDATE public.user_profiles
  SET welcome_coupon_granted = true
  WHERE id = p_user_id;

  -- REQ-009
  RETURN jsonb_build_object('success', true, 'coupon_id', v_coupon_id);

EXCEPTION WHEN OTHERS THEN
  -- REQ-010: propagar excepción al caller
  RAISE;
END;
$$;

COMMENT ON FUNCTION public.grant_welcome_coupon(UUID) IS
'Otorga un cupón de bienvenida al usuario en su primer registro. Valida: feature activa, prize configurado, campaign_end, expiry_date (auto-deshabilita si pasó), y que no se haya otorgado antes. source = welcome.';
