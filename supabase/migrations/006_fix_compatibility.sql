-- Migration 007: Corregir compatibilidad app_configurations
-- Fecha: 2025-08-28
-- Propósito: Crear vista de compatibilidad para app_configurations sin conflictos

-- ============================================
-- 1. ELIMINAR TABLA ANTERIOR SI EXISTE
-- ============================================

DROP TABLE IF EXISTS app_configurations CASCADE;

-- ============================================
-- 2. CREAR VISTA DE COMPATIBILIDAD
-- ============================================

CREATE VIEW app_configurations AS
SELECT 
    key,
    value,
    updated_at,
    updated_by
FROM system_settings
WHERE category = 'prizes' OR key = 'prize_limits';

-- ============================================
-- 3. PERMISOS PARA LA VISTA
-- ============================================

GRANT SELECT ON app_configurations TO authenticated;

-- ============================================
-- 4. ACTUALIZAR FUNCIÓN update_prize_limits SI NO EXISTE
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
-- 5. COMENTARIOS
-- ============================================

COMMENT ON VIEW app_configurations IS 'Vista de compatibilidad que mapea system_settings a la interfaz anterior';
COMMENT ON FUNCTION update_prize_limits(INT, INT, UUID) IS 'Función de compatibilidad para actualizar límites de premios';
