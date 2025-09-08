-- ============================================
-- MIGRACIÓN DE MEJORAS DE SEGURIDAD - PARA EJECUTAR DESPUÉS DEL MVP
-- ============================================
-- NOTA: Esta migración arregla los warnings del linter de Supabase
-- No ejecutar hasta que el MVP esté completo y en producción estable
-- ============================================

-- 1. ARREGLAR FUNCTION SEARCH PATH MUTABLE
-- ============================================

-- Función uid (crítica para RLS)
CREATE OR REPLACE FUNCTION public.uid()
RETURNS UUID 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql STABLE
AS $$
  SELECT auth.uid()
$$;

-- Función current_role (crítica para RLS)
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE id = auth.uid()),
    'client'
  );
$$;

-- Función is_admin_any (crítica para RLS)
CREATE OR REPLACE FUNCTION public.is_admin_any()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'superadmin') FROM user_profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Función is_verifier (crítica para RLS)
CREATE OR REPLACE FUNCTION public.is_verifier()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT role IN ('verifier', 'manager', 'admin', 'superadmin') FROM user_profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Función current_branch (crítica para RLS)
CREATE OR REPLACE FUNCTION public.current_branch()
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT branch_id FROM user_profiles WHERE id = auth.uid()),
    NULL::UUID
  );
$$;

-- 2. ARREGLAR OTRAS FUNCIONES UTILITY
-- ============================================

-- Función generate_unique_code
CREATE OR REPLACE FUNCTION public.generate_unique_code()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql VOLATILE
AS $$
  SELECT UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
$$;

-- Función generate_coupon_code
CREATE OR REPLACE FUNCTION public.generate_coupon_code()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql VOLATILE
AS $$
  SELECT 'CP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
$$;

-- 3. ARREGLAR VISTA SECURITY DEFINER
-- ============================================

-- Recrear vista sin SECURITY DEFINER (será definida con permisos del usuario actual)
DROP VIEW IF EXISTS app_configurations CASCADE;

CREATE VIEW app_configurations AS
SELECT 
    key,
    value,
    updated_at,
    updated_by
FROM system_settings
WHERE category = 'prizes' OR key = 'prize_limits';

-- Permisos explícitos
GRANT SELECT ON app_configurations TO authenticated;

-- 4. COMENTARIOS Y NOTAS
-- ============================================

COMMENT ON FUNCTION public.uid() IS 'Función segura para obtener UID del usuario autenticado';
COMMENT ON FUNCTION public.current_role() IS 'Función segura para obtener rol del usuario actual';
COMMENT ON FUNCTION public.is_admin_any() IS 'Función segura para verificar permisos de admin';
COMMENT ON FUNCTION public.is_verifier() IS 'Función segura para verificar permisos de verificador';
COMMENT ON FUNCTION public.current_branch() IS 'Función segura para obtener sucursal del usuario';

-- ============================================
-- BENEFICIOS ESPERADOS DESPUÉS DE APLICAR:
-- ============================================
-- ✅ Elimina warnings de function_search_path_mutable
-- ✅ Elimina error de security_definer_view  
-- ✅ Mejora seguridad general contra SQL injection
-- ✅ Posiblemente resuelve issue intermitente de streakPrizes
-- ✅ Cumple con mejores prácticas de Supabase
-- ============================================

-- TODO: Configurar manualmente en Dashboard de Supabase:
-- 1. Auth → Settings → Leaked Password Protection: ON
-- 2. Auth → Settings → Multi-Factor Authentication: Habilitar TOTP
-- ============================================
