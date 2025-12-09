-- ============================================
-- MIGRACIÓN 035: Reparar políticas de branding
-- ============================================
-- La migración 034 falló parcialmente. Esto completa las políticas y settings.

-- 1. POLÍTICAS RLS PARA EL BUCKET (usando user_profiles correcto)

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

-- 2. AGREGAR SETTINGS DE SEO

INSERT INTO system_settings (key, value, description, setting_type, category) VALUES
('seo_title', 'Fuego Extremo - Programa de Recompensas', 'Título SEO de la aplicación (aparece en pestaña del navegador)', 'text', 'seo'),
('seo_description', 'Acumula puntos con cada visita, gira la ruleta y gana increíbles premios. El programa de fidelización más emocionante.', 'Descripción SEO para motores de búsqueda', 'text', 'seo'),
('favicon_url', '', 'URL del favicon (32x32 px, formatos: .ico, .png)', 'text', 'seo'),
('apple_touch_icon_url', '', 'URL del icono para iOS cuando agregan a pantalla de inicio (180x180 px)', 'text', 'seo'),
('og_image_url', '', 'URL de imagen para redes sociales cuando comparten el link (1200x630 px recomendado)', 'text', 'seo'),
('seo_keywords', 'recompensas, puntos, ruleta, premios, fidelización, cupones', 'Palabras clave SEO separadas por comas', 'text', 'seo'),
('seo_author', '', 'Autor/Empresa para metadatos', 'text', 'seo')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  setting_type = EXCLUDED.setting_type,
  category = EXCLUDED.category;
