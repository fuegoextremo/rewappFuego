-- ============================================================
-- Migration 047: Agregar claves de imágenes de racha a system_settings
-- y re-asegurar políticas de branding bucket para admins
-- ============================================================

-- 1. Insertar claves de imágenes de racha si no existen
INSERT INTO public.system_settings (key, value, description, setting_type, category)
VALUES
  ('streak_initial_image',   '/images/badge-default.png', 'Imagen que se muestra en el punto de inicio (0 visitas) del medidor de racha', 'string', 'general'),
  ('streak_progress_default','/images/badge-default.png', 'Imagen del escudo de racha cuando hay progreso pero sin premio alcanzado',       'string', 'general'),
  ('streak_complete_image',  '/images/badge-default.png', 'Imagen del escudo cuando el usuario completa todos los premios de racha',        'string', 'general'),
  ('streak_broken_image',    '/images/badge-default.png', 'Imagen del escudo cuando la racha se rompe',                                     'string', 'general')
ON CONFLICT (key) DO NOTHING;

-- 2. Re-aplicar políticas del bucket branding para permitir admin/manager/superadmin
-- (idempotente: drop + create)

DROP POLICY IF EXISTS "Only superadmin can upload branding files"  ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload branding files"           ON storage.objects;
CREATE POLICY "Admins can upload branding files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Only superadmin can update branding files"  ON storage.objects;
DROP POLICY IF EXISTS "Admins can update branding files"           ON storage.objects;
CREATE POLICY "Admins can update branding files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'manager')
  )
)
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Only superadmin can delete branding files"  ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete branding files"           ON storage.objects;
CREATE POLICY "Admins can delete branding files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin', 'manager')
  )
);
