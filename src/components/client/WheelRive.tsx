'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';

// Types for Rive event system
interface RiveEventData {
  name?: string;
  stateName?: string;
}

interface RiveStateChangeEvent {
  data: RiveEventData | RiveEventData[];
}

interface RiveWithEventSystem {
  on?: (eventType: string, callback: (event: RiveStateChangeEvent) => void) => void;
  off?: (eventType: string, callback: (event: RiveStateChangeEvent) => void) => void;
  addEventListener?: (eventType: string, callback: (event: RiveStateChangeEvent) => void) => void;
  removeEventListener?: (eventType: string, callback: (event: RiveStateChangeEvent) => void) => void;
}

const ARTBOARD = undefined;       // o 'WheelArtboard' si lo nombraste
const STATE_MACHINE = 'WheelSM';  // 👈 exacto como en Rive

type WheelRiveProps = {
  onSpinComplete?: () => void;
  spinning?: boolean;
}

export type WheelRiveRef = {
  triggerSpin: (win: boolean) => boolean;
  resetSpin: () => void;
}

const WheelRive = forwardRef<WheelRiveRef, WheelRiveProps>(({ onSpinComplete /* spinning */ }, ref) => {
  const { rive, RiveComponent } = useRive({
    src: '/wheel_v1.riv',
    stateMachines: STATE_MACHINE,
    artboard: ARTBOARD,
    autoplay: true,
    shouldDisableRiveListeners: false,
    // 🎨 Configuración de layout para proporción 1200x1000 (6:5)
    layout: new Layout({
      fit: Fit.Cover,     // Mantiene la proporción original 6:5, sin distorsión
      alignment: Alignment.Center  // Centra el contenido
    })
  });

  const spin   = useStateMachineInput(rive, STATE_MACHINE, 'spin');   // Trigger
  const isWin  = useStateMachineInput(rive, STATE_MACHINE, 'isWin');  // Boolean
  const spinningRef = useRef(false);
  // const [internalSpinning, setInternalSpinning] = useState(false); // Para debug UI

  // 🔄 Función para resetear el estado de giro
  const resetSpin = useCallback(() => {
    // console.log('🔄 Reseteando estado de giro RIVE');
    spinningRef.current = false;
    // setInternalSpinning(false); // Para debug UI
  }, []);

  // 🎯 Función para activar el giro
  const triggerSpin = useCallback((win: boolean) => {
    if (!spin || !isWin || spinningRef.current) {
      // console.warn('⚠️ No se puede girar: spin, isWin o ya girando', { spin: !!spin, isWin: !!isWin, spinning: spinningRef.current });
      return false;
    }
    
    // console.log('🎰 Iniciando animación RIVE:', win ? 'GANAR' : 'PERDER');
    isWin.value = win;
    spinningRef.current = true;
    // setInternalSpinning(true); // Para debug UI
    spin.fire();
    return true;
  }, [spin, isWin]);

  // Exponer funciones al componente padre
  useImperativeHandle(ref, () => ({
    triggerSpin,
    resetSpin
  }), [triggerSpin, resetSpin]);

  // Escucha cambios de estado para detectar cuándo vuelve a Idle y terminar el giro
  useEffect(() => {
    if (!rive) return;
    
    const onStateChange = (event: RiveStateChangeEvent) => {
      // console.log('🎰 RIVE State Change:', event.data);
      
      // Detectar estados de transición específicos
      const eventData = Array.isArray(event.data) ? event.data : [event.data];
      
      let currentState = null;
      for (const data of eventData) {
        if (data?.name || data?.stateName) {
          currentState = data.name || data.stateName;
          break;
        }
      }
      
      if (currentState) {
        // console.log('🎯 Estado actual de RIVE:', currentState);
        
        // Detectar estados de transición después del spin
        if ((currentState === 'SpinWinToInitial' || currentState === 'SpinLoseToInitial') && spinningRef.current) {
          // console.log('🔄 Detectado estado de transición:', currentState, '- Esperando regreso a Idle...');
        }
        
        // Solo resetear cuando vuelva a Idle después de las transiciones
        if (currentState === 'Idle' && spinningRef.current) {
          // console.log('🎰 Animación RIVE completada, volviendo a Idle desde estado de transición');
          resetSpin();
          
          // Notificar al componente padre que terminó
          if (onSpinComplete) {
            onSpinComplete();
          }
        }
      }
    };

    // Usar múltiples event listeners para capturar el cambio de estado
    try {
      const riveWithEvents = rive as unknown as RiveWithEventSystem;
      
      // Método principal
      if (typeof riveWithEvents.on === 'function') {
        riveWithEvents.on('statechange', onStateChange);
      }
      
      // Método alternativo usando addEventListener
      if (typeof riveWithEvents.addEventListener === 'function') {
        riveWithEvents.addEventListener('statechange', onStateChange);
      }
      
      // Listener para el state machine específico
      const stateMachine = rive.stateMachineInputs(STATE_MACHINE);
      if (stateMachine) {
        // console.log('📊 Estado inicial del state machine:', stateMachine);
      }
      
      return () => {
        try {
          const riveWithEvents = rive as unknown as RiveWithEventSystem;
          if (typeof riveWithEvents.off === 'function') {
            riveWithEvents.off('statechange', onStateChange);
          }
          if (typeof riveWithEvents.removeEventListener === 'function') {
            riveWithEvents.removeEventListener('statechange', onStateChange);
          }
        } catch {
          // console.warn('⚠️ Error limpiando listeners de RIVE:', cleanupError);
        }
      };
    } catch {
      // console.warn('⚠️ Error configurando listener de RIVE:', error);
    }
  }, [rive, onSpinComplete, resetSpin]);

  // const isCurrentlySpinning = spinning || internalSpinning; // Para debug UI

  return (
  <div className="w-full">                   {/* Responsivo hasta 384px */}
    <div className="relative w-full aspect-[9/13]">             {/* Proporción exacta 1200:1000 */}
      <RiveComponent
        className="absolute inset-0 w-full h-full"
      />
    </div>
      
      {/* 🎯 Estado visual para debug (solo en desarrollo) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          {isCurrentlySpinning ? '🎰 Girando...' : '⏸️ En reposo'}
          <div className="text-xs opacity-60">Proporción: 6:5 (1200x1000)</div>
        </div>
      )} */}
    </div>
  );
});

WheelRive.displayName = 'WheelRive';

export default WheelRive;
