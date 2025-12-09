-- ============================================
-- MIGRACIÓN 034: Crear bucket de branding y settings SEO
-- ============================================
-- Propósito: 
--   1. Crear bucket público para logos, favicons e imágenes de branding
--   2. Agregar configuraciones SEO a system_settings
--   3. Configurar políticas RLS para el bucket

-- ============================================
-- 1. CREAR BUCKET DE BRANDING
-- ============================================

-- Insertar el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,  -- Público para que SEO funcione correctamente
  5242880,  -- 5MB límite
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];

-- ============================================
-- 2. POLÍTICAS RLS PARA EL BUCKET
-- ============================================

-- Política: Cualquiera puede ver los archivos (público)
DROP POLICY IF EXISTS "Branding files are publicly accessible" ON storage.objects;
CREATE POLICY "Branding files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Política: Solo superadmin puede subir archivos
DROP POLICY IF EXISTS "Only superadmin can upload branding files" ON storage.objects;
CREATE POLICY "Only superadmin can upload branding files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Política: Solo superadmin puede actualizar archivos
DROP POLICY IF EXISTS "Only superadmin can update branding files" ON storage.objects;
CREATE POLICY "Only superadmin can update branding files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Política: Solo superadmin puede eliminar archivos
DROP POLICY IF EXISTS "Only superadmin can delete branding files" ON storage.objects;
CREATE POLICY "Only superadmin can delete branding files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding' 
  AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- ============================================
-- 3. AGREGAR SETTINGS DE SEO
-- ============================================

INSERT INTO system_settings (key, value, description, setting_type, category) VALUES
-- SEO básico
('seo_title', 'Fuego Extremo - Programa de Recompensas', 'Título SEO de la aplicación (aparece en pestaña del navegador)', 'text', 'seo'),
('seo_description', 'Acumula puntos con cada visita, gira la ruleta y gana increíbles premios. El programa de fidelización más emocionante.', 'Descripción SEO para motores de búsqueda', 'text', 'seo'),

-- Imágenes de branding
('favicon_url', '', 'URL del favicon (32x32 px, formatos: .ico, .png)', 'text', 'seo'),
('apple_touch_icon_url', '', 'URL del icono para iOS cuando agregan a pantalla de inicio (180x180 px)', 'text', 'seo'),
('og_image_url', '', 'URL de imagen para redes sociales cuando comparten el link (1200x630 px recomendado)', 'text', 'seo'),

-- Información adicional de SEO
('seo_keywords', 'recompensas, puntos, ruleta, premios, fidelización, cupones', 'Palabras clave SEO separadas por comas', 'text', 'seo'),
('seo_author', '', 'Autor/Empresa para metadatos', 'text', 'seo')

ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  setting_type = EXCLUDED.setting_type,
  category = EXCLUDED.category;

-- ============================================
-- 4. NOTIFICACIÓN DE ÉXITO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migración 034 completada:';
  RAISE NOTICE '   📦 Bucket "branding" creado (público)';
  RAISE NOTICE '   🔒 Políticas RLS configuradas (superadmin upload, public read)';
  RAISE NOTICE '   🌐 Settings SEO agregados (seo_title, seo_description, favicon, og_image, etc.)';
END $$;
