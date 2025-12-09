-- ============================================
-- MIGRACIÓN 036: Permitir acceso público a settings SEO
-- ============================================
-- Los settings de SEO (favicon, og_image, etc.) deben ser públicos
-- para que funcionen con bots de redes sociales y navegadores

-- Actualizar política para incluir categoría 'seo'
DROP POLICY IF EXISTS "system_settings_public_read_policy" ON system_settings;

CREATE POLICY "system_settings_public_read_policy" ON system_settings
    FOR SELECT USING (
        -- Permitir acceso público a configuraciones de branding/empresa/seo
        category IN ('general', 'branding', 'seo') OR
        key IN (
            'company_name',
            'company_logo_url', 
            'company_theme_primary',
            'company_theme_secondary',
            'company_terms_conditions',
            'company_privacy_policy',
            'seo_title',
            'seo_description',
            'seo_keywords',
            'seo_author',
            'favicon_url',
            'apple_touch_icon_url',
            'og_image_url'
        ) OR
        -- Usuarios autenticados pueden leer todo
        auth.role() = 'authenticated'
    );

COMMENT ON POLICY "system_settings_public_read_policy" ON system_settings IS 
'Permite acceso público a configuraciones de branding, SEO y empresa. Acceso completo a usuarios autenticados.';
