-- Migración para agregar campos de rachas completadas y lógica avanzada
-- Fecha: 2025-09-09
-- Propósito: 
-- 1. Agregar completed_count para historial de rachas
-- 2. Agregar is_just_completed para estado temporal de UI
-- 3. Preparar estructura para generación automática de cupones

-- ============================================
-- 1. AGREGAR NUEVOS CAMPOS A TABLA STREAKS
-- ============================================

-- Campo para contar rachas completadas históricamente
ALTER TABLE public.streaks 
ADD COLUMN IF NOT EXISTS completed_count INTEGER DEFAULT 0;

-- Campo temporal para manejar estado visual "recién completada"
ALTER TABLE public.streaks 
ADD COLUMN IF NOT EXISTS is_just_completed BOOLEAN DEFAULT false;

-- Comentarios para documentar
COMMENT ON COLUMN public.streaks.completed_count IS 'Contador de rachas completadas históricamente por usuario';
COMMENT ON COLUMN public.streaks.is_just_completed IS 'Flag temporal para mostrar estado "recién completada" hasta próximo check-in';

-- ============================================
-- 2. FUNCIÓN AUXILIAR PARA GENERAR CUPONES AUTOMÁTICOS
-- ============================================

CREATE OR REPLACE FUNCTION generate_streak_coupon(
  p_user_id UUID,
  p_streak_threshold INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize_record RECORD;
BEGIN
  -- Buscar premio activo para este threshold
  SELECT id, validity_days, name
  INTO v_prize_record
  FROM public.prizes 
  WHERE type = 'streak' 
    AND is_active = true 
    AND streak_threshold = p_streak_threshold
    AND (deleted_at IS NULL)
  LIMIT 1;

  -- Si existe el premio, generar cupón automático
  IF v_prize_record.id IS NOT NULL THEN
    -- Usar función existente grant_manual_coupon pero marcar como 'streak'
    PERFORM public.grant_manual_coupon(
      p_user_id, 
      v_prize_record.id, 
      COALESCE(v_prize_record.validity_days, 30)
    );
    
    -- Log para debugging (opcional)
    RAISE NOTICE 'Cupón automático generado: Usuario %, Premio %, Threshold %', 
      p_user_id, v_prize_record.name, p_streak_threshold;
  END IF;
END;
$$;

-- ============================================
-- 3. FUNCIÓN AUXILIAR PARA VERIFICAR COMPLETACIÓN
-- ============================================

CREATE OR REPLACE FUNCTION check_streak_completion(
  p_user_id UUID,
  p_current_count INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_threshold INTEGER;
BEGIN
  -- Obtener el threshold máximo configurado
  SELECT MAX(streak_threshold) 
  INTO v_max_threshold
  FROM public.prizes 
  WHERE type = 'streak' 
    AND is_active = true 
    AND (deleted_at IS NULL)
    AND streak_threshold IS NOT NULL;

  -- Si alcanzó el máximo threshold, marcar como completada
  IF v_max_threshold IS NOT NULL AND p_current_count >= v_max_threshold THEN
    UPDATE public.streaks 
    SET 
      completed_count = completed_count + 1,
      current_count = 0,  -- Reiniciar para próxima racha
      is_just_completed = true,  -- Flag para UI
      updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN true; -- Racha completada
  END IF;
  
  RETURN false; -- Racha no completada
END;
$$;

-- ============================================
-- 4. ÍNDICES PARA OPTIMIZAR PERFORMANCE
-- ============================================

-- Índice para búsquedas de premios por threshold
CREATE INDEX IF NOT EXISTS idx_prizes_streak_threshold 
ON public.prizes (type, streak_threshold, is_active) 
WHERE type = 'streak' AND deleted_at IS NULL;

-- Índice para consultas de rachas completadas
CREATE INDEX IF NOT EXISTS idx_streaks_completed_count 
ON public.streaks (user_id, completed_count) 
WHERE completed_count > 0;

-- ============================================
-- 5. TRIGGER PARA LIMPIAR is_just_completed
-- ============================================

-- Función para resetear flag temporal en próximo check-in
CREATE OR REPLACE FUNCTION reset_just_completed_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si había flag de "recién completada", resetearlo
  IF OLD.is_just_completed = true THEN
    NEW.is_just_completed = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta ANTES de actualizar streaks
CREATE TRIGGER trigger_reset_just_completed
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW
  WHEN (NEW.current_count > 0 AND OLD.is_just_completed = true)
  EXECUTE FUNCTION reset_just_completed_flag();

-- ============================================
-- 6. VALIDACIÓN Y COMENTARIOS FINALES
-- ============================================

-- Verificar que las columnas se agregaron correctamente
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'streaks' AND column_name = 'completed_count'
  ) THEN 
    RAISE EXCEPTION 'Error: Campo completed_count no se agregó correctamente';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'streaks' AND column_name = 'is_just_completed'
  ) THEN 
    RAISE EXCEPTION 'Error: Campo is_just_completed no se agregó correctamente';
  END IF;
  
  RAISE NOTICE 'Migración 014 completada exitosamente: Campos y funciones de rachas completadas agregados';
END $$;

-- Comentario final
COMMENT ON TABLE public.streaks IS 'Tabla de rachas con soporte para rachas completadas y cupones automáticos';
