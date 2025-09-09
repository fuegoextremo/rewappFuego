-- 🔧 Migración 14: Arreglar Realtime para user_spins
-- Fecha: 2025-09-08
-- Descripción: Habilitar Realtime específicamente para la tabla user_spins

-- 1. Verificar estado actual de la publicación
SELECT 'Estado antes del fix:' as mensaje;
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'user_spins' 
    AND pubname = 'supabase_realtime';

-- 2. Añadir user_spins a la publicación de Realtime
ALTER publication supabase_realtime ADD table user_spins;

-- 3. Verificar que se añadió correctamente
SELECT 'Estado después del fix:' as mensaje;
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'user_spins' 
    AND pubname = 'supabase_realtime';

-- 4. Asegurar que user_spins tiene REPLICA IDENTITY FULL
ALTER TABLE user_spins REPLICA IDENTITY FULL;

-- 5. Verificar la configuración final
SELECT 'Configuración final de REPLICA IDENTITY:' as mensaje;
SELECT 
    schemaname as schema_name,
    tablename as table_name,
    CASE c.relreplident
        WHEN 'd' THEN 'default'
        WHEN 'n' THEN 'nothing'
        WHEN 'f' THEN 'full'
        WHEN 'i' THEN 'index'
    END as replica_identity_description
FROM pg_publication_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE pt.tablename = 'user_spins'
    AND pt.schemaname = 'public'
    AND pt.pubname = 'supabase_realtime';

-- 6. Mensaje de confirmación
SELECT 'Realtime habilitado para user_spins - Los eventos de UPDATE ahora funcionarán' as resultado;
