-- ============================================
-- MIGRACIÓN: Agregar configuraciones de Analytics
-- ============================================
-- Objetivo: Insertar las claves de analytics en system_settings
-- para que puedan ser actualizadas desde la UI

-- Insertar configuraciones de analytics en system_settings
INSERT INTO system_settings (key, value, description, setting_type, category) VALUES
-- Configuraciones de Analytics (SuperAdmin)
('analytics_checkin_value', '50', 'Valor monetario estimado por check-in', 'number', 'analytics'),
('analytics_coupon_avg_value', '150', 'Valor promedio de cupones', 'number', 'analytics'),
('analytics_user_acquisition_cost', '200', 'Costo de adquisición por usuario', 'number', 'analytics'),
('analytics_spin_cost', '10', 'Costo estimado por spin', 'number', 'analytics'),
('analytics_retention_multiplier', '1.5', 'Multiplicador de retención', 'number', 'analytics'),
('analytics_premium_branch_multiplier', '1.2', 'Multiplicador para sucursales premium', 'number', 'analytics')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    setting_type = EXCLUDED.setting_type,
    category = EXCLUDED.category,
    updated_at = NOW();

-- Comentario para documentación
COMMENT ON TABLE system_settings IS 'Configuraciones del sistema - ahora incluye analytics';