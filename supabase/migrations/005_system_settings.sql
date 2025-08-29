-- Migration 005: System Settings Configuration
-- Configuraciones del sistema para SuperAdmin y Admin

-- Tabla para configuraciones del sistema (clave-valor)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    setting_type VARCHAR(50) NOT NULL DEFAULT 'string', -- string, number, boolean, json
    category VARCHAR(50) NOT NULL, -- prizes, coupons, general, notifications
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_active ON system_settings(is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuraciones por defecto
INSERT INTO system_settings (key, value, description, setting_type, category) VALUES
-- Configuraciones de Premios/Ruleta (SuperAdmin)
('max_prizes_per_company', '50', 'Número máximo de premios por empresa', 'number', 'prizes'),
('roulette_win_percentage', '15', 'Porcentaje de ganancia de la ruleta (1-100)', 'number', 'prizes'),
('spin_cooldown_seconds', '30', 'Tiempo mínimo entre spins en segundos', 'number', 'prizes'),

-- Configuraciones de Cupones (SuperAdmin)
('default_coupon_expiry_days', '30', 'Días de expiración por defecto para cupones (si no se especifica por premio)', 'number', 'coupons'),

-- Configuraciones de Check-ins/Notificaciones (Admin)
('checkin_points_daily', '10', 'Puntos otorgados por check-in diario', 'number', 'notifications'),
('max_checkins_per_day', '1', 'Límite de check-ins por usuario por día', 'number', 'notifications'),

-- Configuraciones Generales (SuperAdmin)
('company_name', 'Mi Empresa', 'Nombre de la empresa', 'string', 'general'),
('company_logo_url', '', 'URL del logo de la empresa', 'string', 'general'),
('company_theme_primary', '#8b5cf6', 'Color primario del tema corporativo', 'string', 'general'),
('company_theme_secondary', '#a855f7', 'Color secundario del tema corporativo', 'string', 'general'),
('company_contact_email', '', 'Email de contacto de la empresa', 'string', 'general'),
('company_contact_phone', '', 'Teléfono de contacto de la empresa', 'string', 'general'),
('company_address', '', 'Dirección de la empresa', 'string', 'general'),
('company_terms_conditions', 'Términos y condiciones por definir...', 'Términos y condiciones de la empresa', 'text', 'general'),
('company_privacy_policy', 'Política de privacidad por definir...', 'Política de privacidad de la empresa', 'text', 'general');

-- RLS (Row Level Security)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy para lectura: usuarios autenticados pueden leer
CREATE POLICY "system_settings_read_policy" ON system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para escritura: solo superadmins y admins pueden modificar según categoría
CREATE POLICY "system_settings_write_policy" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND (
                up.role = 'superadmin' OR 
                (up.role = 'admin' AND category = 'notifications')
            )
        )
    );

-- Función helper para obtener configuración
CREATE OR REPLACE FUNCTION get_system_setting(setting_key VARCHAR)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT value INTO setting_value 
    FROM system_settings 
    WHERE key = setting_key AND is_active = true;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para actualizar configuración
CREATE OR REPLACE FUNCTION update_system_setting(setting_key VARCHAR, new_value TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE system_settings 
    SET value = new_value, updated_by = user_id, updated_at = timezone('utc'::text, now())
    WHERE key = setting_key AND is_active = true;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE system_settings IS 'Configuraciones del sistema para SuperAdmin y Admin';
COMMENT ON COLUMN system_settings.key IS 'Clave única de la configuración';
COMMENT ON COLUMN system_settings.value IS 'Valor de la configuración (siempre como texto)';
COMMENT ON COLUMN system_settings.setting_type IS 'Tipo de dato: string, number, boolean, json, text';
COMMENT ON COLUMN system_settings.category IS 'Categoría: prizes, coupons, general, notifications';
