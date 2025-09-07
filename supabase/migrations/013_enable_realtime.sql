-- Migración para habilitar Realtime en tablas críticas
-- Esto asegura que las tablas puedan enviar notificaciones en tiempo real

-- Habilitar REPLICA IDENTITY para que Realtime funcione correctamente
-- Esto permite que Supabase capture todos los cambios en las tablas

-- Check-ins: tabla crítica para notificaciones de check-in exitoso
ALTER TABLE public.check_ins REPLICA IDENTITY FULL;

-- User spins: para actualizar giros disponibles en tiempo real
ALTER TABLE public.user_spins REPLICA IDENTITY FULL;

-- Streaks: para actualizar progreso de rachas en tiempo real  
ALTER TABLE public.streaks REPLICA IDENTITY FULL;

-- Coupons: para futuras notificaciones de premios ganados
ALTER TABLE public.coupons REPLICA IDENTITY FULL;

-- Comentarios para documentar el propósito
COMMENT ON TABLE public.check_ins IS 'Tabla habilitada para Realtime - notificaciones de check-in';
COMMENT ON TABLE public.user_spins IS 'Tabla habilitada para Realtime - actualización de giros';
COMMENT ON TABLE public.streaks IS 'Tabla habilitada para Realtime - progreso de rachas';
COMMENT ON TABLE public.coupons IS 'Tabla habilitada para Realtime - notificaciones de premios';
