-- ============================================================
-- Migration 041: Corregir usuario auth para leo@neutrondigital.mx
-- Problema: campos requeridos por Supabase Auth faltantes al
-- insertar directamente en auth.users via SQL
-- ============================================================

SET search_path = extensions, public, auth;

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'leo@neutrondigital.mx';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: leo@neutrondigital.mx';
  END IF;

  -- Rellenar todos los campos que Supabase Auth requiere para el grant_type=password
  UPDATE auth.users SET
    instance_id                = '00000000-0000-0000-0000-000000000000',
    aud                        = 'authenticated',
    role                       = 'authenticated',
    encrypted_password         = extensions.crypt('Rewapp2026!', extensions.gen_salt('bf')),
    email_confirmed_at         = COALESCE(email_confirmed_at, NOW()),
    confirmation_token         = '',
    recovery_token             = '',
    email_change               = '',
    email_change_token_new     = '',
    email_change_token_current = '',
    reauthentication_token     = '',
    phone                      = NULL,
    phone_confirmed_at         = NULL,
    last_sign_in_at            = NULL,
    raw_app_meta_data          = '{"provider": "email", "providers": ["email"]}'::jsonb,
    raw_user_meta_data         = COALESCE(raw_user_meta_data, '{"first_name": "Leo", "last_name": "Neutron"}'::jsonb),
    is_super_admin             = false,
    is_sso_user                = false,
    deleted_at                 = NULL,
    updated_at                 = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE 'Usuario auth corregido: % (id: %)', 'leo@neutrondigital.mx', v_user_id;
END;
$$;
