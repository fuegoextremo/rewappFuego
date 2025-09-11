'use client';

import { useEffect, useState } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { motion } from 'framer-motion';

interface SimpleRiveLoopProps {
  src: string;
  className?: string;
  onError?: (src: string) => void;
}

const SimpleRiveLoop: React.FC<SimpleRiveLoopProps> = ({ 
  src, 
  className = "",
  onError 
}) => {
  console.log('🎭 SimpleRiveLoop rendering with src:', src);
  
  const [hasError, setHasError] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  const { rive, RiveComponent } = useRive({
    src: src,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center
    })
  });

  // Verificar si Rive se carga exitosamente
  useEffect(() => {
    if (rive) {
      console.log('✅ Rive loaded successfully:', src);
      setHasError(false);
    }
  }, [rive, src]);

  // Resetear animación cuando cambia el src
  useEffect(() => {
    setAnimationComplete(false);
  }, [src]);

  // Timeout de seguridad para detectar errores
  useEffect(() => {
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
      <motion.div 
        className={`${className} flex items-center justify-center bg-gray-100 text-gray-500`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          duration: 0.6
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-sm">Animation Loading...</div>
        </div>
      </motion.div>
    );
  }

  // ✨ Usar motion solo durante la animación inicial, luego div normal para calidad máxima
  if (!animationComplete) {
    return (
      <motion.div 
        className={className}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          duration: 0.6
        }}
        onAnimationComplete={() => {
          console.log('🎉 Animation completed, switching to div for quality');
          setAnimationComplete(true);
        }}
      >
        <RiveComponent className="w-full h-full" />
      </motion.div>
    );
  }

  // ✅ Div normal después de la animación - calidad máxima preservada
  return (
    <div className={className}>
      <RiveComponent className="w-full h-full" />
    </div>
  );
};

export default SimpleRiveLoop;