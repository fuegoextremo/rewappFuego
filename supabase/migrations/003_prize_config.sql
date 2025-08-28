-- Crear tabla de configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Insertar configuraciones iniciales
INSERT INTO system_settings (key, value) VALUES
('prize_limits', jsonb_build_object(
    'max_roulette_prizes', 20,
    'max_streak_prizes', 10
))
ON CONFLICT (key) DO NOTHING;

-- Función para actualizar límites de premios (solo superadmin)
CREATE OR REPLACE FUNCTION update_prize_limits(
    p_max_roulette INT,
    p_max_streak INT,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Verificar si el usuario es superadmin
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE id = p_user_id;

    IF v_user_role != 'superadmin' THEN
        RAISE EXCEPTION 'Solo superadmins pueden modificar estos límites';
    END IF;

    -- Actualizar configuración
    UPDATE app_configurations
    SET 
        value = jsonb_build_object(
            'max_roulette_prizes', p_max_roulette,
            'max_streak_prizes', p_max_streak
        ),
        updated_at = NOW()
    WHERE key = 'prize_limits'
    RETURNING value;

    RETURN (SELECT value FROM app_configurations WHERE key = 'prize_limits');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
