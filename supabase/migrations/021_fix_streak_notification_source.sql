-- ============================================
-- MIGRACIÓN: Fix Streak Notification Source
-- ============================================
-- Problema: Los cupones de streak se crean con source='manual' 
-- causando que las notificaciones digan "admin" en lugar de "streak"
-- Solución: Modificar grant_manual_coupon para aceptar source como parámetro

-- ============================================
-- 1. ACTUALIZAR grant_manual_coupon CON PARÁMETRO SOURCE
-- ============================================
CREATE OR REPLACE FUNCTION grant_manual_coupon(
  p_user_id UUID,
  p_prize_id UUID,
  p_validity_days INTEGER DEFAULT 30,
  p_source TEXT DEFAULT 'manual'
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
  -- Validar source permitido
  IF p_source NOT IN ('roulette', 'streak', 'manual') THEN
    RAISE EXCEPTION 'Fuente inválida: %. Debe ser roulette, streak, o manual', p_source;
  END IF;

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
  -- GENERAR CUPÓN CON SOURCE CORRECTO
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
    p_source,  -- ← Usar el parámetro source en lugar de hardcodear 'manual'
    NOW()
  )
  RETURNING id INTO v_coupon_id;
  
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'unique_code', v_coupon_code,
    'expires_at', v_expires_at,
    'prize_type', v_prize_type,
    'source', p_source,
    'stock_affected', (v_prize_type = 'roulette')
  );
END;
$$;

-- ============================================
-- 2. ACTUALIZAR generate_streak_coupon PARA USAR SOURCE='streak'
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
    -- Usar función grant_manual_coupon con source='streak'
    PERFORM public.grant_manual_coupon(
      p_user_id, 
      v_prize_record.id, 
      COALESCE(v_prize_record.validity_days, 30),
      'streak'  -- ← Especificar source='streak' explícitamente
    );
    
    -- Log para debugging
    RAISE NOTICE 'Cupón automático generado: Usuario %, Premio %, Threshold %, Source: streak', 
      p_user_id, v_prize_record.name, p_streak_threshold;
  END IF;
END;
$$;

-- ============================================
-- 3. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================
COMMENT ON FUNCTION grant_manual_coupon(UUID, UUID, INTEGER, TEXT) IS 
'Función mejorada para crear cupones con source específico. Parámetros:
- p_user_id: ID del usuario
- p_prize_id: ID del premio  
- p_validity_days: Días de validez (default 30)
- p_source: Fuente del cupón (roulette/streak/manual, default manual)
Control de stock diferenciado por tipo de premio.';

COMMENT ON FUNCTION generate_streak_coupon(UUID, INTEGER) IS 
'Genera cupón automático por completar racha. Usa source=streak para notificaciones correctas.';

-- ============================================
-- 4. VALIDACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración 019 completada: Source de cupones streak corregido';
  RAISE NOTICE '📋 Cambios aplicados:';
  RAISE NOTICE '   - grant_manual_coupon ahora acepta parámetro source';
  RAISE NOTICE '   - generate_streak_coupon usa source=streak';
  RAISE NOTICE '   - Las notificaciones de streak ahora serán correctas';
END;
$$;
