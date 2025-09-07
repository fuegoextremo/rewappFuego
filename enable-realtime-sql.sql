-- Comando SQL para habilitar Realtime en Dashboard de Supabase
-- Copia y pega esto en el SQL Editor de tu Dashboard

-- 1. Habilitar Realtime para check_ins
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;

-- 2. Habilitar Realtime para user_spins  
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_spins;

-- 3. Habilitar Realtime para streaks
ALTER PUBLICATION supabase_realtime ADD TABLE public.streaks;

-- 4. Habilitar Realtime para coupons (opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;

-- Verificar que están habilitadas
SELECT 
  schemaname,
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
