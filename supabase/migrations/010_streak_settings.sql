-- Migración para agregar configuraciones de rachas
-- Fecha: 2025-08-29

-- Agregar configuración para días de romper racha
INSERT INTO public.system_settings (key, value, description, setting_type, category, is_active)
VALUES (
  'streak_break_days',
  '12', 
  'Días sin check-in después de los cuales la racha se rompe',
  'number',
  'notifications',
  true
) ON CONFLICT (key) DO NOTHING;

-- Agregar configuración para días de expiración total
INSERT INTO public.system_settings (key, value, description, setting_type, category, is_active)
VALUES (
  'streak_expiry_days',
  '90',
  'Días totales después de los cuales la racha expira completamente',
  'number',
  'notifications',
  true
) ON CONFLICT (key) DO NOTHING;
