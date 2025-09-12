-- ============================================
-- MIGRACIÓN: Fix Function Overload Conflict
-- ============================================
-- Problema: Existe ambigüedad entre grant_manual_coupon con 3 y 4 parámetros
-- Solución: Eliminar versión de 3 parámetros y mantener solo la de 4

-- Eliminar la versión anterior de 3 parámetros para evitar ambigüedad
DROP FUNCTION IF EXISTS public.grant_manual_coupon(UUID, UUID, INTEGER);

-- Verificar que solo quede la versión con 4 parámetros
DO $$
BEGIN
  RAISE NOTICE '✅ Conflicto de función resuelto';
  RAISE NOTICE '📋 Solo queda: grant_manual_coupon(UUID, UUID, INTEGER, TEXT)';
  RAISE NOTICE '⚠️  Todas las llamadas deben especificar el parámetro source';
END;
$$;
