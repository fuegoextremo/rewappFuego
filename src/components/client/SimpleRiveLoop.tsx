'use client';

import { useEffect, useState, memo } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface SimpleRiveLoopProps {
  src: string;
  className?: string;
  onError?: (src: string) => void;
}

const SimpleRiveLoop = function SimpleRiveLoop({ src, className, onError }: SimpleRiveLoopProps) {
  console.log('🎭 SimpleRiveLoop rendering with src:', src);
  
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialMount, setIsInitialMount] = useState(true);

  console.log('🔍 SimpleRiveLoop state:', { hasError, isLoading, isInitialMount, src });

  const { rive, RiveComponent } = useRive({
    src: src,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center
    })
  });

  console.log('🔍 useRive result:', { rive: !!rive, RiveComponent: !!RiveComponent });

  // Verificar si Rive se carga exitosamente
  useEffect(() => {
    console.log('🔄 useEffect[rive, src] triggered:', { rive: !!rive, src });
    if (rive) {
      console.log('✅ Rive loaded successfully:', src);
      setHasError(false);
      setIsLoading(false);
    }
  }, [rive, src]);

  // ✨ Marcar que ya no es mount inicial después de un tiempo
  useEffect(() => {
    console.log('🔄 useEffect[initial mount] triggered');
    const timer = setTimeout(() => {
      console.log('⏰ Setting isInitialMount to false');
      setIsInitialMount(false);
    }, 700); // Después de que termine la animación CSS
    
    return () => clearTimeout(timer);
  }, []);

  // Timeout de seguridad para detectar errores
  useEffect(() => {
    console.log('🔄 useEffect[timeout] triggered:', { rive: !!rive, hasError, src });
    const timer = setTimeout(() => {
      if (!rive && !hasError) {
        console.log('⏰ Timeout loading Rive animation:', src);
        setHasError(true);
        if (onError) onError(src);
      }
    }, 8000); // 8 segundos - más tiempo para archivos más grandes

    return () => clearTimeout(timer);
  }, [rive, hasError, onError, src]);

  // Si hay error, mostrar fallback
  if (hasError) {
    console.log('💥 Showing fallback for:', src);
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gray-100 text-gray-500 ${isInitialMount ? 'animate-rive-enter initial-mount' : ''}`}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-sm">Animation Loading...</div>
        </div>
      </div>
    );
  }

  // ✨ Componente simple con CSS animation solo en mount inicial
  return (
    <div className={`${className} ${isInitialMount ? 'animate-rive-enter initial-mount' : ''} relative`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse">
          <div className="text-2xl">🎭</div>
        </div>
      )}
      <RiveComponent className="w-full h-full" />
    </div>
  );
};

SimpleRiveLoop.displayName = 'SimpleRiveLoop';

// Custom comparison function para debugging
const arePropsEqual = (prevProps: SimpleRiveLoopProps, nextProps: SimpleRiveLoopProps) => {
  const areEqual = prevProps.src === nextProps.src && 
                   prevProps.className === nextProps.className && 
                   prevProps.onError === nextProps.onError;
  
  if (!areEqual) {
    console.log('🔍 SimpleRiveLoop props changed:', {
      srcChanged: prevProps.src !== nextProps.src,
      classNameChanged: prevProps.className !== nextProps.className,
      onErrorChanged: prevProps.onError !== nextProps.onError,
      prevSrc: prevProps.src,
      nextSrc: nextProps.src
    });
  }
  
  return areEqual;
};

export default memo(SimpleRiveLoop, arePropsEqual);