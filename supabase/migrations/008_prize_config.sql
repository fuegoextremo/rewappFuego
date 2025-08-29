-- MIGRACIÓN 003: ACTUALIZADA para compatibilidad
-- Esta migración crea la función update_prize_limits que requiere el código existente
-- Pero la actualiza para usar system_settings en lugar de app_configurations

-- ============================================
-- FUNCIÓN COMPATIBLE: update_prize_limits
-- ============================================

CREATE OR REPLACE FUNCTION update_prize_limits(
    p_max_roulette INT,
    p_max_streak INT,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_role TEXT;
    v_result JSONB;
BEGIN
    -- Verificar si el usuario es superadmin
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE id = p_user_id;

    IF v_user_role != 'superadmin' THEN
        RAISE EXCEPTION 'Solo superadmins pueden modificar estos límites';
    END IF;

    -- Actualizar en system_settings usando la estructura nueva
    INSERT INTO system_settings (key, value, category, data_type, updated_by)
    VALUES (
        'prize_limits',
        jsonb_build_object(
            'max_roulette_prizes', p_max_roulette,
            'max_streak_prizes', p_max_streak
        ),
        'prizes',
        'json',
        p_user_id
    )
    ON CONFLICT (key) DO UPDATE SET
        value = jsonb_build_object(
            'max_roulette_prizes', p_max_roulette,
            'max_streak_prizes', p_max_streak
        ),
        updated_at = NOW(),
        updated_by = p_user_id;

    -- Retornar el valor actualizado
    SELECT value INTO v_result 
    FROM system_settings 
    WHERE key = 'prize_limits';

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VISTA COMPATIBILIDAD: app_configurations
-- ============================================

-- Eliminar vista o tabla si existe para crear vista fresca
DROP VIEW IF EXISTS app_configurations CASCADE;
DROP TABLE IF EXISTS app_configurations CASCADE;

-- Crear vista para mantener compatibilidad con código existente
CREATE VIEW app_configurations AS
SELECT 
    key,
    value,
    updated_at,
    updated_by
FROM system_settings
WHERE category = 'prizes' OR key = 'prize_limits';

-- Permitir lectura de la vista
GRANT SELECT ON app_configurations TO authenticated;
