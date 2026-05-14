-- ============================================================
-- SEED LIMPIO — Solo superadmin inicial
-- ============================================================
-- Propósito: estado mínimo para un proyecto nuevo en producción.
-- No incluye premios, sucursales de prueba, clientes ni actividad.
-- El superadmin puede configurar todo desde la interfaz admin.
--
-- Credenciales del superadmin:
--   Email:    leo@neutrondigital.mx
--   Password: (debe cambiarse en el primer acceso o desde Supabase Auth)
-- ============================================================

-- 1. CREAR USUARIO SUPERADMIN EN AUTH
-- La contraseña inicial es un placeholder seguro; se debe resetear
-- desde Supabase Auth Dashboard o enviando un magic link al email.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'authenticated',
  'authenticated',
  'leo@neutrondigital.mx',
  crypt('Cambiar_en_primer_acceso!', gen_salt('bf')),
  NOW(),
  '{"first_name": "Leo", "last_name": "Gordillo"}',
  NOW(),
  NOW(),
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. ASIGNAR ROL SUPERADMIN EN USER_PROFILES
-- El trigger handle_new_user() ya crea el perfil; solo actualizamos el rol.
UPDATE public.user_profiles
SET role = 'superadmin'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 3. CONFIGURACIÓN MÍNIMA DEL SISTEMA
-- Valores por defecto seguros. El superadmin puede modificarlos desde admin.
INSERT INTO public.system_settings (key, value, description, created_at, updated_at)
VALUES
  ('checkin_points_daily', '1',  'Giros por check-in diario',             NOW(), NOW()),
  ('max_checkins_per_day', '1',  'Máximo de check-ins por día',           NOW(), NOW()),
  ('streak_expiry_days',   '90', 'Días hasta que expire la racha',        NOW(), NOW()),
  ('streak_break_days',    '1',  'Días de inactividad para romper racha', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- Estado final esperado:
--   auth.users          → 1 fila (superadmin)
--   user_profiles       → 1 fila con role = 'superadmin'
--   system_settings     → 4 filas con configuración base
--   prizes              → vacío (configurar desde admin)
--   branches            → vacío (configurar desde admin)
-- ============================================================
