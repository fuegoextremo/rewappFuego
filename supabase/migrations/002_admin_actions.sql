
-- Function to increment a user's spin count, handling inserts if the user has no spins yet.
CREATE OR REPLACE FUNCTION increment_user_spins(p_user_id UUID, p_spin_amount INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_spins (user_id, available_spins, updated_at)
  VALUES (p_user_id, p_spin_amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    available_spins = user_spins.available_spins + p_spin_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to grant a new coupon to a user based on a prize.
CREATE OR REPLACE FUNCTION grant_coupon_to_user(
  p_user_id UUID,
  p_prize_id UUID,
  p_validity_days INT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_validity_days INT;
  v_expires_at TIMESTAMPTZ;
  v_unique_code TEXT;
  v_coupon_id UUID;
BEGIN
  -- Get the validity days (use parameter if provided, otherwise use prize's default)
  IF p_validity_days IS NOT NULL THEN
    v_validity_days := p_validity_days;
  ELSE
    SELECT validity_days INTO v_validity_days
    FROM public.prizes
    WHERE id = p_prize_id;
  END IF;

  -- Calculate the expiration date
  IF v_validity_days IS NOT NULL THEN
    v_expires_at := NOW() + (v_validity_days * INTERVAL '1 day');
  ELSE
    v_expires_at := NULL;
  END IF;

  -- Generate unique coupon code
  SELECT generate_coupon_code() INTO v_unique_code;

  -- Insert the new coupon
  INSERT INTO public.coupons (
    user_id,
    prize_id,
    unique_code,
    expires_at,
    source,
    is_redeemed
  )
  VALUES (
    p_user_id,
    p_prize_id,
    v_unique_code,
    v_expires_at,
    'manual',
    FALSE
  )
  RETURNING id INTO v_coupon_id;

  -- Return the created coupon details
  RETURN json_build_object(
    'coupon_id', v_coupon_id,
    'unique_code', v_unique_code,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql;
