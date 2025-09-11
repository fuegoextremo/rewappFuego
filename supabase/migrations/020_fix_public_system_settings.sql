-- Migración: Permitir acceso público a configuraciones de branding
-- Para permitir que el login y páginas públicas accedan al logo y branding

-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "system_settings_read_policy" ON system_settings;

-- Crear nueva política que permite lectura pública de configuraciones de branding
CREATE POLICY "system_settings_public_read_policy" ON system_settings
    FOR SELECT USING (
        -- Permitir acceso público a configuraciones de branding/empresa
        category IN ('general', 'branding') OR
        key IN (
            'company_name',
            'company_logo_url', 
            'company_theme_primary',
            'company_theme_secondary',
            'company_terms_conditions',
            'company_privacy_policy'
        ) OR
        -- Usuarios autenticados pueden leer todo
        auth.role() = 'authenticated'
    );

-- Comentario explicativo
COMMENT ON POLICY "system_settings_public_read_policy" ON system_settings IS 
'Permite acceso público a configuraciones de branding y acceso completo a usuarios autenticados';
