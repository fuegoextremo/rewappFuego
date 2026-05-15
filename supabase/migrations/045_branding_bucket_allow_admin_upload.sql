-- Migración 045: Permitir a admins subir archivos al bucket branding
-- La política anterior solo permitía superadmin. Extendemos a admin y manager
-- para que puedan subir el logo de empresa desde la página de ajustes.

DROP POLICY IF EXISTS "Only superadmin can upload branding files" ON storage.objects;
CREATE POLICY "Admins can upload branding files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Only superadmin can update branding files" ON storage.objects;
CREATE POLICY "Admins can update branding files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Only superadmin can delete branding files" ON storage.objects;
CREATE POLICY "Admins can delete branding files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin', 'manager')
  )
);
