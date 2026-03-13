-- ============================================================
-- Migration 040: Seed superadmin inicial
-- Usuario: leo@neutrondigital.mx
-- Este script es idempotente (ON CONFLICT DO NOTHING / DO UPDATE)
-- ============================================================

SET search_path = extensions, public, auth;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Solo insertar si el email no existe ya en auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'leo@neutrondigital.mx'
  ) THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'leo@neutrondigital.mx',
      crypt('Rewapp2026!', gen_salt('bf')),
      NOW(),
      '{"first_name": "Leo", "last_name": "Neutron"}',
      false,
      NOW(),
      NOW(),
      '',
      ''
    );

    -- El trigger handle_new_user() crea el perfil con role='client'
    -- Actualizamos a superadmin
    UPDATE public.user_profiles
    SET
      role = 'superadmin',
      first_name = 'Leo',
      last_name = 'Neutron',
      email = 'leo@neutrondigital.mx',
      is_active = true,
      updated_at = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE 'Superadmin creado: leo@neutrondigital.mx (id: %)', v_user_id;
  ELSE
    -- Si ya existe, solo aseguramos que tenga rol superadmin
    UPDATE public.user_profiles up
    SET
      role = 'superadmin',
      is_active = true,
      updated_at = NOW()
    FROM auth.users au
    WHERE au.email = 'leo@neutrondigital.mx'
      AND up.id = au.id;

    RAISE NOTICE 'Usuario ya existente, rol actualizado a superadmin: leo@neutrondigital.mx';
  END IF;
END;
$$;
