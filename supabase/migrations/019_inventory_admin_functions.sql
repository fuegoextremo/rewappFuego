-- ============================================
-- FUNCIONES ADMINISTRATIVAS PARA GESTIÓN DE STOCK
-- ============================================

-- ============================================
-- 1. FUNCIÓN: REPORTE DE STOCK ACTUAL
-- ============================================
CREATE OR REPLACE FUNCTION get_inventory_report()
RETURNS TABLE(
  prize_id UUID,
  prize_name TEXT,
  prize_type TEXT,
  current_stock INTEGER,
  pending_coupons INTEGER,
  expired_coupons INTEGER,
  redeemed_coupons INTEGER,
  stock_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as prize_id,
    p.name as prize_name,
    p.type as prize_type,
    CASE 
      WHEN p.type = 'streak' THEN 999999 
      ELSE COALESCE(p.current_stock, 0) 
    END as current_stock,
    
    -- Cupones pendientes (activos, no expirados, no redimidos)
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM coupons c 
      WHERE c.prize_id = p.id 
        AND c.is_redeemed = false 
        AND c.expires_at > NOW()
    ), 0) as pending_coupons,
    
    -- Cupones expirados (no redimidos)
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM coupons c 
      WHERE c.prize_id = p.id 
        AND c.is_redeemed = false 
        AND c.expires_at <= NOW()
    ), 0) as expired_coupons,
    
    -- Cupones redimidos
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM coupons c 
      WHERE c.prize_id = p.id 
        AND c.is_redeemed = true
    ), 0) as redeemed_coupons,
    
    -- Estado del stock
    CASE 
      WHEN p.type = 'streak' THEN 'INFINITO'
      WHEN COALESCE(p.current_stock, 0) = 0 THEN 'AGOTADO'
      WHEN COALESCE(p.current_stock, 0) <= 5 THEN 'BAJO'
      WHEN COALESCE(p.current_stock, 0) <= 20 THEN 'NORMAL'
      ELSE 'ALTO'
    END as stock_status
    
  FROM prizes p
  WHERE p.is_active = true
    AND p.deleted_at IS NULL
  ORDER BY 
    p.type DESC, -- streak primero
    p.current_stock ASC NULLS FIRST;
END;
$$;

-- ============================================
-- 2. FUNCIÓN: REPORTE DE CUPONES EXPIRADOS RECUPERABLES
-- ============================================
CREATE OR REPLACE FUNCTION get_recoverable_coupons()
RETURNS TABLE(
  prize_id UUID,
  prize_name TEXT,
  prize_type TEXT,
  expired_count INTEGER,
  potential_recovery INTEGER,
  oldest_expiration TIMESTAMPTZ,
  newest_expiration TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as prize_id,
    p.name as prize_name,
    p.type as prize_type,
    COUNT(c.id)::INTEGER as expired_count,
    CASE 
      WHEN p.type = 'streak' THEN 0  -- No se recupera stock de premios streak
      ELSE COUNT(c.id)::INTEGER 
    END as potential_recovery,
    MIN(c.expires_at) as oldest_expiration,
    MAX(c.expires_at) as newest_expiration
    
  FROM prizes p
  INNER JOIN coupons c ON c.prize_id = p.id
  WHERE c.expires_at < NOW()
    AND c.is_redeemed = false
    AND c.stock_returned = false
    AND p.is_active = true
  GROUP BY p.id, p.name, p.type
  ORDER BY expired_count DESC;
END;
$$;

-- ============================================
-- 3. FUNCIÓN: EJECUTAR RECUPERACIÓN CON REPORTE DETALLADO
-- ============================================
CREATE OR REPLACE FUNCTION execute_stock_recovery_with_report()
RETURNS TABLE(
  action_type TEXT,
  prize_id UUID,
  prize_name TEXT,
  recovered_count INTEGER,
  new_stock INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recovery_record RECORD;
  v_total_recovered INTEGER := 0;
  v_prizes_affected INTEGER := 0;
BEGIN
  -- Ejecutar recuperación y capturar resultados
  FOR v_recovery_record IN 
    SELECT * FROM recover_expired_coupon_stock()
  LOOP
    v_total_recovered := v_total_recovered + v_recovery_record.recovered_count;
    v_prizes_affected := v_prizes_affected + 1;
    
    -- Devolver detalle de cada premio recuperado
    action_type := 'RECOVERY';
    prize_id := v_recovery_record.prize_id;
    prize_name := v_recovery_record.prize_name;
    recovered_count := v_recovery_record.recovered_count;
    new_stock := v_recovery_record.new_stock;
    message := format('Stock recuperado: %s cupones → nuevo stock: %s', 
                     v_recovery_record.recovered_count, 
                     v_recovery_record.new_stock);
    
    RETURN NEXT;
  END LOOP;
  
  -- Devolver resumen final
  action_type := 'SUMMARY';
  prize_id := NULL;
  prize_name := NULL;
  recovered_count := v_total_recovered;
  new_stock := v_prizes_affected;
  message := format('Recuperación completada: %s cupones de %s premios procesados', 
                   v_total_recovered, v_prizes_affected);
  
  RETURN NEXT;
END;
$$;

-- ============================================
-- 4. FUNCIÓN: VALIDAR INTEGRIDAD DE INVENTARIO
-- ============================================
CREATE OR REPLACE FUNCTION validate_inventory_integrity()
RETURNS TABLE(
  check_type TEXT,
  prize_id UUID,
  prize_name TEXT,
  issue_description TEXT,
  suggested_action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar premios con stock negativo
  RETURN QUERY
  SELECT 
    'NEGATIVE_STOCK'::TEXT as check_type,
    p.id as prize_id,
    p.name as prize_name,
    format('Stock actual: %s (negativo)', p.current_stock) as issue_description,
    'Revisar manualmente y ajustar stock'::TEXT as suggested_action
  FROM prizes p
  WHERE p.current_stock < 0 
    AND p.type != 'streak'
    AND p.is_active = true;
  
  -- Verificar cupones pendientes vs stock disponible
  RETURN QUERY
  SELECT 
    'OVERSOLD'::TEXT as check_type,
    p.id as prize_id,
    p.name as prize_name,
    format('Stock: %s, Cupones pendientes: %s', 
           COALESCE(p.current_stock, 0),
           COALESCE(pending.count, 0)) as issue_description,
    'Posible sobreventa - revisar cupones activos'::TEXT as suggested_action
  FROM prizes p
  LEFT JOIN (
    SELECT 
      prize_id, 
      COUNT(*) as count
    FROM coupons 
    WHERE is_redeemed = false 
      AND expires_at > NOW()
    GROUP BY prize_id
  ) pending ON pending.prize_id = p.id
  WHERE p.type != 'streak'
    AND p.is_active = true
    AND COALESCE(p.current_stock, 0) < COALESCE(pending.count, 0);
    
  -- Verificar cupones con stock_returned = false pero ya procesados
  RETURN QUERY
  SELECT 
    'UNPROCESSED_EXPIRED'::TEXT as check_type,
    p.id as prize_id,
    p.name as prize_name,
    format('%s cupones expirados sin procesar', COUNT(c.id)) as issue_description,
    'Ejecutar recuperación de stock'::TEXT as suggested_action
  FROM prizes p
  INNER JOIN coupons c ON c.prize_id = p.id
  WHERE c.expires_at < NOW()
    AND c.is_redeemed = false
    AND c.stock_returned = false
    AND p.type != 'streak'
    AND p.is_active = true
  GROUP BY p.id, p.name
  HAVING COUNT(c.id) > 0;
END;
$$;

-- ============================================
-- 5. COMENTARIOS PARA FUNCIONES ADMINISTRATIVAS
-- ============================================

COMMENT ON FUNCTION get_inventory_report() IS 
'Reporte completo del estado de inventario: stock actual, cupones pendientes/expirados/redimidos';

COMMENT ON FUNCTION get_recoverable_coupons() IS 
'Lista de cupones expirados que pueden recuperar stock al inventario';

COMMENT ON FUNCTION execute_stock_recovery_with_report() IS 
'Ejecuta recuperación de stock con reporte detallado de la operación';

COMMENT ON FUNCTION validate_inventory_integrity() IS 
'Valida integridad del inventario y detecta inconsistencias o problemas';

-- Verificación final
DO $$ 
BEGIN 
  RAISE NOTICE 'Funciones administrativas de inventario creadas exitosamente:';
  RAISE NOTICE '📊 get_inventory_report() - Reporte completo de inventario';
  RAISE NOTICE '🔄 get_recoverable_coupons() - Cupones recuperables';
  RAISE NOTICE '⚡ execute_stock_recovery_with_report() - Recuperación con reporte';
  RAISE NOTICE '🔍 validate_inventory_integrity() - Validación de integridad';
END $$;
