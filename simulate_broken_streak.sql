-- 🧪 SCRIPT PARA SIMULAR RACHA ROTA
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar configuración actual de días para romper racha
SELECT key, value FROM system_settings WHERE key = 'streak_break_days';

-- 2. Asegurar que está configurado a 12 días (o el valor que quieras)
UPDATE system_settings 
SET value = '12' 
WHERE key = 'streak_break_days';

-- 3. Simular racha rota para un usuario específico
-- CAMBIAR 'tu-user-id' por el ID real del usuario
UPDATE streaks 
SET 
  current_count = 5,  -- Racha activa (> 0)
  last_check_in = CURRENT_DATE - INTERVAL '15 days',  -- Hace 15 días (> 12)
  expires_at = CURRENT_DATE + INTERVAL '30 days'  -- Aún no expirada
WHERE user_id = 'tu-user-id';

-- 4. Verificar el resultado
SELECT 
  user_id,
  current_count,
  last_check_in,
  CURRENT_DATE - last_check_in::date AS days_since_checkin,
  expires_at
FROM streaks 
WHERE user_id = 'tu-user-id';

-- 5. Para RESTAURAR la racha normal después de probar:
-- UPDATE streaks 
-- SET last_check_in = CURRENT_DATE
-- WHERE user_id = 'tu-user-id';