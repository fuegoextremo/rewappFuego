'use client';

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
  /** Si debe ejecutarse automáticamente al montar el componente */
  autoTrigger?: boolean;
  /** Intensidad del confetti (default: 'medium') */
  intensity?: 'light' | 'medium' | 'intense';
  /** Colores personalizados para el confetti */
  colors?: string[];
  /** Callback que se ejecuta cuando termina el efecto */
  onComplete?: () => void;
}

interface FireOptions {
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  autoTrigger = true,
  intensity = 'medium',
  colors,
  onComplete
}) => {

  const getIntensityConfig = useCallback(() => {
    switch (intensity) {
      case 'light':
        return { particleCount: 50, spread: 60 };
      case 'intense':
        return { particleCount: 150, spread: 120 };
      default: // medium
        return { particleCount: 100, spread: 90 };
    }
  }, [intensity]);

  const triggerConfetti = useCallback(() => {
    const intensityConfig = getIntensityConfig();
    const confettiColors = colors || ['#ff9a00', '#ff7400', '#ff4d00', '#D73527', '#ffffff'];
    
    // Configuración base más elegante
    const defaults = {
      origin: { y: 0.7 },
      colors: confettiColors,
      disableForReducedMotion: true
    };

    // Función para disparar confetti con diferentes configuraciones (más sutil)
    const fire = (particleRatio: number, opts: FireOptions) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(intensityConfig.particleCount * particleRatio)
      });
    };

    // Secuencia de disparos más elegante y menos agresiva
    const launchElegantConfetti = () => {
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      
      fire(0.2, {
        spread: 60,
      });
      
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    };

    // Lanzar el efecto elegante solo una vez (no repetir)
    launchElegantConfetti();
    
    // Llamar onComplete después de un tiempo estimado
    if (onComplete) {
      setTimeout(onComplete, 3000);
    }
  }, [colors, onComplete, getIntensityConfig]);

  useEffect(() => {
    if (autoTrigger) {
      // Pequeño delay para asegurar que el componente está montado
      const timer = setTimeout(triggerConfetti, 500);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, triggerConfetti]);

  // Este componente no renderiza nada visible, solo maneja el efecto
  // canvas-confetti maneja su propio canvas automáticamente
  return null;
};

export default ConfettiCelebration;