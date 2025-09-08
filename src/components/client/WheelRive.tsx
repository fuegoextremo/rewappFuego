'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

const ARTBOARD = undefined;       // o 'WheelArtboard' si lo nombraste
const STATE_MACHINE = 'WheelSM';  // 👈 exacto como en Rive

type WheelRiveProps = {
  onSpinComplete?: () => void;
  spinning?: boolean;
}

export type WheelRiveRef = {
  triggerSpin: (win: boolean) => boolean;
}

const WheelRive = forwardRef<WheelRiveRef, WheelRiveProps>(({ onSpinComplete, spinning }, ref) => {
  const { rive, RiveComponent } = useRive({
    src: '/wheel_v1.riv',         // coloca tu .riv en /public
    stateMachines: STATE_MACHINE,
    artboard: ARTBOARD,
    autoplay: true,
  });

  const spin   = useStateMachineInput(rive, STATE_MACHINE, 'spin');   // Trigger
  const isWin  = useStateMachineInput(rive, STATE_MACHINE, 'isWin');  // Boolean
  const spinningRef = useRef(false);
  const [internalSpinning, setInternalSpinning] = useState(false);

  // 🎯 Función para activar el giro
  const triggerSpin = (win: boolean) => {
    if (!spin || !isWin || spinningRef.current) {
      console.warn('⚠️ No se puede girar: spin, isWin o ya girando', { spin: !!spin, isWin: !!isWin, spinning: spinningRef.current });
      return false;
    }
    
    console.log('🎰 Iniciando animación RIVE:', win ? 'GANAR' : 'PERDER');
    isWin.value = win;
    spinningRef.current = true;
    setInternalSpinning(true);
    spin.fire();
    return true;
  };

  // Exponer funciones al componente padre
  useImperativeHandle(ref, () => ({
    triggerSpin
  }), [spin, isWin]);

  // Escucha cambios de estado para detectar cuándo vuelve a Idle y terminar el giro
  useEffect(() => {
    if (!rive) return;
    
    const onStateChange = (event: any) => {
      console.log('🎰 RIVE State Change:', event.data);
      // Cuando entre a Idle después de Spin*, terminó el giro
      if (event.data?.name === 'Idle' && spinningRef.current) {
        console.log('🎰 Animación RIVE completada, volviendo a Idle')
        spinningRef.current = false;
        setInternalSpinning(false);
        
        // Notificar al componente padre que terminó
        if (onSpinComplete) {
          onSpinComplete();
        }
      }
    };

    // Usar el event listener correcto de RIVE
    try {
      (rive as any).on('statechange', onStateChange);
      return () => {
        (rive as any).off('statechange', onStateChange);
      };
    } catch (error) {
      console.warn('⚠️ Error configurando listener de RIVE:', error);
    }
  }, [rive, onSpinComplete]);

  const isCurrentlySpinning = spinning || internalSpinning;

  return (
    <div className="inline-flex flex-col items-center">
      <RiveComponent className="w-[340px] h-[340px]" />
      
      {/* 🎯 Estado visual para debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          {isCurrentlySpinning ? '🎰 Girando...' : '⏸️ En reposo'}
        </div>
      )}
    </div>
  );
});

WheelRive.displayName = 'WheelRive';

export default WheelRive;
