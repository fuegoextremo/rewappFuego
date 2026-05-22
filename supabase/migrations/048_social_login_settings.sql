-- 048_social_login_settings.sql
-- Agrega configuraciones para habilitar/deshabilitar login social (Google, Facebook).
-- Por defecto deshabilitados. Cada instancia los activa desde el panel de admin/superadmin.

INSERT INTO public.system_settings (key, value, category, description, is_active)
VALUES
  ('enable_google_login',   'false', 'general', 'Mostrar botón de inicio de sesión con Google',   true),
  ('enable_facebook_login', 'false', 'general', 'Mostrar botón de inicio de sesión con Facebook', true)
ON CONFLICT (key) DO NOTHING;
