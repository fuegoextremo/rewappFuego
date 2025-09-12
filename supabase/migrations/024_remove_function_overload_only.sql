-- ============================================
-- MIGRACIÓN PRECISA: Eliminar solo el conflicto
-- ============================================
-- Problema: Dos versiones de grant_manual_coupon causan ambigüedad
-- Solución: Eliminar SOLO la versión de 4 parámetros

-- Eliminar SOLO la versión de 4 parámetros que causa el conflicto
DROP FUNCTION IF EXISTS public.grant_manual_coupon(UUID, UUID, INTEGER, TEXT);

-- ============================================
-- VALIDACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración 024 PRECISA completada: Solo eliminamos el conflicto';
  RAISE NOTICE '📋 Funciones que quedan:';
  RAISE NOTICE '   - grant_manual_coupon(3 params) - FUNCIONA ✅';
  RAISE NOTICE '   - grant_streak_coupon(3 params) - FUNCIONA ✅';
  RAISE NOTICE '   - generate_streak_coupon(2 params) - FUNCIONA ✅';
  RAISE NOTICE '⚠️  Ya NO hay conflicto de overload';
END;
$$;
