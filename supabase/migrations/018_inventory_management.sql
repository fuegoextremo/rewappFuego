-- Migración para sistema inteligente de inventario
-- Fecha: 2025-09-10
-- Propósito: Control de stock diferenciado y recuperación automática

-- ============================================
-- 1. FUNCIÓN MEJORADA: grant_manual_coupon
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
  -- GENERAR CUPÓN
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
    'manual',
    NOW()
  )
  RETURNING id INTO v_coupon_id;
  
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'unique_code', v_coupon_code,
    'expires_at', v_expires_at,
    'prize_type', v_prize_type,
    'stock_affected', (v_prize_type = 'roulette')
  );
END;
$$;

-- ============================================
-- 2. FUNCIÓN: recover_expired_stock (CON MARCADO)
-- ============================================
CREATE OR REPLACE FUNCTION recover_expired_stock()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize_recovery RECORD;
  v_total_recovered INTEGER := 0;
BEGIN
  -- Recuperar stock de cupones expirados no redimidos (solo premios de ruleta)
  FOR v_prize_recovery IN
    SELECT 
      p.id as prize_id,
      p.name as prize_name,
      p.inventory_count as current_stock,
      COUNT(c.id) as expired_coupons
    FROM prizes p
    INNER JOIN coupons c ON c.prize_id = p.id
    WHERE p.type = 'roulette'  -- Solo premios de ruleta tienen stock
      AND c.is_redeemed = false
      AND c.expires_at < NOW()
      AND c.stock_recovered = false  -- Solo cupones no recuperados
    GROUP BY p.id, p.name, p.inventory_count
  LOOP
    -- Actualizar stock del premio
    UPDATE prizes 
    SET inventory_count = inventory_count + v_prize_recovery.expired_coupons,
        updated_at = NOW()
    WHERE id = v_prize_recovery.prize_id;
    
    -- Marcar cupones como stock recuperado (NO eliminar)
    UPDATE coupons 
    SET stock_recovered = true,
        updated_at = NOW()
    WHERE prize_id = v_prize_recovery.prize_id
      AND is_redeemed = false
      AND expires_at < NOW()
      AND stock_recovered = false;
    
    v_total_recovered := v_total_recovered + v_prize_recovery.expired_coupons;
    
    RAISE NOTICE 'Recuperado stock para "%": % unidades (% -> %)', 
      v_prize_recovery.prize_name, 
      v_prize_recovery.expired_coupons,
      v_prize_recovery.current_stock,
      (v_prize_recovery.current_stock + v_prize_recovery.expired_coupons);
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_recovered', v_total_recovered,
    'processed_at', NOW(),
    'message', format('Se recuperaron %s unidades de stock de cupones expirados', v_total_recovered)
  );
END;
$$;

-- ============================================
-- 3. FUNCIÓN: get_stock_recovery_preview (SIMPLE)
-- ============================================
CREATE OR REPLACE FUNCTION get_stock_recovery_preview()
RETURNS TABLE(
  prize_id UUID,
  prize_name TEXT,
  current_stock INTEGER,
  expired_coupons BIGINT,
  stock_after_recovery INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Retornar todos los datos (paginación en frontend)
  RETURN QUERY
  SELECT 
    p.id as prize_id,
    p.name as prize_name,
    p.inventory_count as current_stock,
    COUNT(c.id) as expired_coupons,
    (p.inventory_count + COUNT(c.id))::INTEGER as stock_after_recovery
  FROM prizes p
  LEFT JOIN coupons c ON c.prize_id = p.id
    AND c.is_redeemed = false
    AND c.expires_at < NOW()
    AND c.stock_recovered = false  -- Solo cupones no recuperados
  WHERE p.type = 'roulette'
    AND p.is_active = true
  GROUP BY p.id, p.name, p.inventory_count
  HAVING COUNT(c.id) > 0  -- Solo mostrar premios con cupones a recuperar
  ORDER BY p.name;
END;
$$;

-- ============================================
-- 4. AGREGAR COLUMNA stock_recovered A coupons
-- ============================================
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS stock_recovered BOOLEAN DEFAULT false;

-- Crear índice para optimizar performance de recuperación
CREATE INDEX IF NOT EXISTS idx_coupons_stock_recovery 
ON coupons(prize_id, is_redeemed, expires_at, stock_recovered)
WHERE is_redeemed = false AND stock_recovered = false;

-- ============================================
-- 5. COMENTARIOS Y VALIDACIONES FINALES
-- ============================================
COMMENT ON FUNCTION grant_manual_coupon(UUID, UUID, INTEGER) IS 
'Genera cupones con control de stock inteligente: descontando para ruleta, ilimitado para rachas';

COMMENT ON FUNCTION recover_expired_stock() IS 
'Recupera stock marcando cupones expirados como recuperados (mantiene datos para analytics)';

COMMENT ON FUNCTION get_stock_recovery_preview() IS 
'Vista previa de stock que se puede recuperar de cupones expirados no recuperados (sin paginación - datos completos)';

COMMENT ON COLUMN coupons.stock_recovered IS 
'Indica si el stock de este cupón expirado ya fue recuperado (mantiene cupón para analytics)';

-- Verificar funciones creadas
DO $$ 
BEGIN 
  RAISE NOTICE 'Sistema de inventario inteligente implementado:';
  RAISE NOTICE '✅ grant_manual_coupon con control diferenciado por tipo';
  RAISE NOTICE '✅ recover_expired_stock con marcado (conserva datos)';
  RAISE NOTICE '✅ get_stock_recovery_preview optimizado';
  RAISE NOTICE '✅ Columna stock_recovered agregada con índice';
  RAISE NOTICE '✅ Datos conservados para analytics futuras';
END $$;
