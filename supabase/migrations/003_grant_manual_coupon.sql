-- Create function to grant manual coupons
CREATE OR REPLACE FUNCTION grant_manual_coupon(
  p_user_id UUID,
  p_prize_id UUID,
  p_validity_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_coupon_id UUID;
BEGIN
  -- Generate unique coupon code
  v_coupon_code := generate_coupon_code();
  
  -- Calculate expiration date
  v_expires_at := NOW() + (p_validity_days || ' days')::INTERVAL;
  
  -- Insert new coupon
  INSERT INTO coupons (
    user_id,
    prize_id,
    unique_code,
    expires_at,
    source
  ) VALUES (
    p_user_id,
    p_prize_id,
    v_coupon_code,
    v_expires_at,
    'manual'
  )
  RETURNING id INTO v_coupon_id;
  
  -- Return success response
  RETURN json_build_object(
    'coupon_id', v_coupon_id,
    'unique_code', v_coupon_code,
    'expires_at', v_expires_at
  );
END;
$$;
