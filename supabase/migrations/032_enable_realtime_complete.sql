-- ============================================
-- MIGRACIÓN 032: Habilitar Realtime Completo
-- ============================================
-- Propósito: Configuración completa de Realtime para instalaciones limpias
-- Incluye: REPLICA IDENTITY + Publicaciones + Permisos

-- ============================================
-- 1. HABILITAR REPLICA IDENTITY (ya existe en 013 pero reforzamos)
-- ============================================

-- Check-ins: notificaciones de check-in exitoso
ALTER TABLE public.check_ins REPLICA IDENTITY FULL;

-- User spins: actualización de giros disponibles
ALTER TABLE public.user_spins REPLICA IDENTITY FULL;

-- Streaks: progreso de rachas en tiempo real
ALTER TABLE public.streaks REPLICA IDENTITY FULL;

-- Coupons: notificaciones de premios ganados
ALTER TABLE public.coupons REPLICA IDENTITY FULL;

-- User profiles: cambios de perfil
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;

-- Roulette spins: historial de giros de ruleta
ALTER TABLE public.roulette_spins REPLICA IDENTITY FULL;

-- ============================================
-- 2. CREAR PUBLICACIÓN PARA REALTIME
-- ============================================

-- Eliminar publicación anterior si existe
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Crear publicación con todas las tablas necesarias
CREATE PUBLICATION supabase_realtime FOR TABLE
  public.check_ins,
  public.user_spins,
  public.streaks,
  public.coupons,
  public.user_profiles,
  public.roulette_spins;

-- ============================================
-- 3. VERIFICAR Y HABILITAR REALTIME EN SUPABASE
-- ============================================

-- Nota: Esto debe hacerse también en Supabase Dashboard:
-- 1. Ir a Database > Replication
-- 2. En cada tabla, habilitar "Enable Realtime"
-- Pero esta migración prepara todo lo necesario en el lado de Postgres

-- ============================================
-- 4. PERMISOS PARA REALTIME (RLS)
-- ============================================

-- Asegurar que las políticas RLS permitan subscripciones

-- Check-ins: usuarios pueden ver sus propios check-ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'check_ins' 
    AND policyname = 'check_ins_realtime_own'
  ) THEN
    CREATE POLICY check_ins_realtime_own ON public.check_ins
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Streaks: usuarios pueden ver sus propias rachas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'streaks' 
    AND policyname = 'streaks_realtime_own'
  ) THEN
    CREATE POLICY streaks_realtime_own ON public.streaks
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- User spins: usuarios pueden ver sus propios giros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_spins' 
    AND policyname = 'user_spins_realtime_own'
  ) THEN
    CREATE POLICY user_spins_realtime_own ON public.user_spins
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Coupons: usuarios pueden ver sus propios cupones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coupons' 
    AND policyname = 'coupons_realtime_own'
  ) THEN
    CREATE POLICY coupons_realtime_own ON public.coupons
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 5. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON PUBLICATION supabase_realtime IS 'Publicación para subscripciones realtime de Supabase';

COMMENT ON TABLE public.check_ins IS 'Realtime habilitado: notificaciones de check-in exitoso';
COMMENT ON TABLE public.user_spins IS 'Realtime habilitado: actualización de giros disponibles';
COMMENT ON TABLE public.streaks IS 'Realtime habilitado: progreso de rachas';
COMMENT ON TABLE public.coupons IS 'Realtime habilitado: notificaciones de premios ganados';
COMMENT ON TABLE public.user_profiles IS 'Realtime habilitado: cambios de perfil';
COMMENT ON TABLE public.roulette_spins IS 'Realtime habilitado: historial de giros';

-- ============================================
-- 6. VERIFICACIÓN
-- ============================================

-- Verificar que las tablas tienen REPLICA IDENTITY configurado
SELECT 
  schemaname,
  tablename,
  CASE relreplident
    WHEN 'd' THEN 'DEFAULT (primary key)'
    WHEN 'f' THEN 'FULL (all columns)'
    WHEN 'i' THEN 'INDEX'
    WHEN 'n' THEN 'NOTHING'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_tables t ON c.relname = t.tablename AND n.nspname = t.schemaname
WHERE schemaname = 'public'
  AND tablename IN ('check_ins', 'user_spins', 'streaks', 'coupons', 'user_profiles', 'roulette_spins')
ORDER BY tablename;

-- Verificar que la publicación existe y contiene las tablas correctas
SELECT 
  pubname as publication,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- Para que Realtime funcione completamente necesitas:
-- 
-- 1. ✅ Esta migración (configura Postgres)
-- 
-- 2. ⚠️  Habilitar en Supabase Dashboard (solo producción):
--    - Ir a: Database > Replication
--    - Para cada tabla: Toggle "Enable Realtime"
-- 
-- 3. ✅ Cliente configurado correctamente (ya lo tienes):
--    - RealtimeManager.ts
--    - useRealtimeManager hook
-- 
-- 4. ✅ RLS Policies (ya las tienes en migration 001)
-- 
-- ============================================
-- TESTING EN LOCAL
-- ============================================
-- 
-- En Supabase Local, Realtime está habilitado por defecto
-- para todas las tablas con REPLICA IDENTITY FULL.
-- 
-- No necesitas habilitar manualmente en Dashboard local.
-- 
-- Para testear:
-- 1. Abrir dos ventanas del browser
-- 2. Hacer check-in en una
-- 3. Ver actualización en tiempo real en la otra ✅
-- 
-- ============================================

-- Registro de migración exitosa
DO $$
BEGIN
  RAISE NOTICE '✅ Migración 032 completada: Realtime habilitado en todas las tablas críticas';
  RAISE NOTICE '📋 Tablas con Realtime:';
  RAISE NOTICE '   - check_ins (notificaciones de check-in)';
  RAISE NOTICE '   - user_spins (actualización de giros)';
  RAISE NOTICE '   - streaks (progreso de rachas)';
  RAISE NOTICE '   - coupons (notificaciones de premios)';
  RAISE NOTICE '   - user_profiles (cambios de perfil)';
  RAISE NOTICE '   - roulette_spins (historial de giros)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: En producción, también habilita Realtime en Dashboard:';
  RAISE NOTICE '   Database > Replication > Enable Realtime para cada tabla';
END $$;
