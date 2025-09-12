-- ============================================
-- MIGRACIÓN UNIFICADA: Fix Streak Notifications
-- ============================================
-- Problema: Los cupones de streak se crean con source='manual' 
-- causando que las notificaciones digan "admin" en lugar de "streak"
-- Solución: Restaurar grant_manual_coupon original + crear función específica para streaks

-- ============================================
-- 1. RESTAURAR FUNCIÓN ORIGINAL grant_manual_coupon (3 PARÁMETROS)
-- ============================================
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
  v_prize_type TEXT;
  v_current_stock INTEGER;
  v_prize_name TEXT;
BEGIN
  -- Obtener información del premio
  SELECT type, inventory_count, name 
  INTO v_prize_type, v_current_stock, v_prize_name
  FROM prizes 
  WHERE id = p_prize_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Premio no encontrado o inactivo';
  END IF;
  
  -- ============================================
  -- CONTROL DE STOCK SEGÚN TIPO DE PREMIO
  -- ============================================
  IF v_prize_type = 'roulette' THEN
    -- Premios de ruleta: verificar y descontar stock
    IF v_current_stock IS NULL OR v_current_stock <= 0 THEN
      RAISE EXCEPTION 'Sin stock disponible para el premio "%"', v_prize_name;
    END IF;
    
    -- Descontar stock
    UPDATE prizes 
    SET inventory_count = inventory_count - 1, updated_at = NOW()
    WHERE id = p_prize_id;
    
    RAISE NOTICE 'Stock descontado para premio "%" (ruleta): % -> %', 
      v_prize_name, v_current_stock, (v_current_stock - 1);
      
  ELSIF v_prize_type = 'streak' THEN
    -- Premios por racha: stock ilimitado (no descontar)
    RAISE NOTICE 'Cupón generado para premio por racha "%": stock ilimitado', v_prize_name;
  END IF;
  
  -- ============================================
  -- GENERAR CUPÓN (ORIGINAL: source='manual')
  -- ============================================
  v_coupon_code := generate_coupon_code();
  v_expires_at := NOW() + (p_validity_days || ' days')::INTERVAL;
  
  INSERT INTO coupons (
    user_id,
    prize_id,
    unique_code,
    expires_at,
    source,
    created_at
  ) VALUES (
    p_user_id,
    p_prize_id,
    v_coupon_code,
    v_expires_at,
    'manual',  -- ← ORIGINAL: siempre 'manual'
    NOW()
  )
  RETURNING id INTO v_coupon_id;
  
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'unique_code', v_coupon_code,
    'expires_at', v_expires_at,
    'prize_type', v_prize_type,
    'source', 'manual',
    'stock_affected', (v_prize_type = 'roulette')
  );
END;
$$;

-- ============================================
-- 2. FUNCIÓN ESPECÍFICA PARA STREAKS (source='streak')
-- ============================================
CREATE OR REPLACE FUNCTION grant_streak_coupon(
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
  v_prize_type TEXT;
  v_prize_name TEXT;
BEGIN
  -- Obtener información del premio
  SELECT type, name 
  INTO v_prize_type, v_prize_name
  FROM prizes 
  WHERE id = p_prize_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Premio no encontrado o inactivo';
  END IF;
  
  -- Verificar que sea premio de streak
  IF v_prize_type != 'streak' THEN
    RAISE EXCEPTION 'Esta función solo es para premios de streak';
  END IF;
  
  -- ============================================
  -- GENERAR CUPÓN CON SOURCE='streak'
  -- ============================================
  v_coupon_code := generate_coupon_code();
  v_expires_at := NOW() + (p_validity_days || ' days')::INTERVAL;
  
  INSERT INTO coupons (
    user_id,
    prize_id,
    unique_code,
    expires_at,
    source,
    created_at
  ) VALUES (
    p_user_id,
    p_prize_id,
    v_coupon_code,
    v_expires_at,
    'streak',  -- ← ESPECÍFICO PARA STREAKS
    NOW()
  )
  RETURNING id INTO v_coupon_id;
  
  RAISE NOTICE 'Cupón de streak generado: Usuario %, Premio %, Source: streak', 
    p_user_id, v_prize_name;
  
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'unique_code', v_coupon_code,
    'expires_at', v_expires_at,
    'source', 'streak'
  );
END;
$$;

-- ============================================
-- 3. ACTUALIZAR generate_streak_coupon PARA USAR LA NUEVA FUNCIÓN
-- ============================================
CREATE OR REPLACE FUNCTION generate_streak_coupon(
  p_user_id UUID,
  p_streak_threshold INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize_record RECORD;
BEGIN
  -- Buscar premio activo para este threshold
  SELECT id, validity_days, name
  INTO v_prize_record
  FROM public.prizes 
  WHERE type = 'streak' 
    AND is_active = true 
    AND streak_threshold = p_streak_threshold
    AND (deleted_at IS NULL)
  LIMIT 1;

  -- Si existe el premio, generar cupón automático con source='streak'
  IF v_prize_record.id IS NOT NULL THEN
    -- Usar la función específica para streaks
    PERFORM public.grant_streak_coupon(
      p_user_id, 
      v_prize_record.id, 
      COALESCE(v_prize_record.validity_days, 30)
    );
    
    RAISE NOTICE 'Cupón automático generado: Usuario %, Premio %, Threshold %', 
      p_user_id, v_prize_record.name, p_streak_threshold;
  END IF;
END;
$$;

-- ============================================
-- 4. DOCUMENTACIÓN Y VALIDACIÓN
-- ============================================
COMMENT ON FUNCTION grant_manual_coupon(UUID, UUID, INTEGER) IS 
'Función original para crear cupones manuales. Siempre usa source=manual.
Compatible con todas las llamadas existentes.';

COMMENT ON FUNCTION grant_streak_coupon(UUID, UUID, INTEGER) IS 
'Función específica para crear cupones de streak. Siempre usa source=streak.
Para notificaciones correctas de "by completing visits".';

COMMENT ON FUNCTION generate_streak_coupon(UUID, INTEGER) IS 
'Genera cupón automático por completar racha. Usa grant_streak_coupon para source=streak correcto.';

DO $$
BEGIN
  RAISE NOTICE '✅ Migración 023 UNIFICADA completada: Streak notifications arregladas';
  RAISE NOTICE '📋 Cambios aplicados:';
  RAISE NOTICE '   - grant_manual_coupon restaurada (3 params) - source=manual';
  RAISE NOTICE '   - grant_streak_coupon nueva (3 params) - source=streak';
  RAISE NOTICE '   - generate_streak_coupon usa grant_streak_coupon';
  RAISE NOTICE '   - Compatibilidad total restaurada';
  RAISE NOTICE '   - Notificaciones de streak ahora serán correctas';
END;
$$;
