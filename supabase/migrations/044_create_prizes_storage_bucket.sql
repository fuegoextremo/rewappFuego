-- ============================================================
-- MIGRACIÓN 044: Bucket de Storage para imágenes de premios
-- ============================================================
-- Crea el bucket "prizes" en Supabase Storage con acceso público
-- de lectura y escritura restringida a roles admin/superadmin.

-- 1. CREAR BUCKET PÚBLICO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prizes',
  'prizes',
  true,
  2097152, -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- 2. POLÍTICA: Lectura pública (cualquier usuario, sin autenticación)
DROP POLICY IF EXISTS "Prize images are publicly accessible" ON storage.objects;
CREATE POLICY "Prize images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'prizes');

-- 3. POLÍTICA: Subida de archivos solo para admin/superadmin
DROP POLICY IF EXISTS "Admin can upload prize images" ON storage.objects;
CREATE POLICY "Admin can upload prize images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prizes'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- 4. POLÍTICA: Actualización solo para admin/superadmin
DROP POLICY IF EXISTS "Admin can update prize images" ON storage.objects;
CREATE POLICY "Admin can update prize images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prizes'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- 5. POLÍTICA: Eliminación solo para admin/superadmin
DROP POLICY IF EXISTS "Admin can delete prize images" ON storage.objects;
CREATE POLICY "Admin can delete prize images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prizes'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);
