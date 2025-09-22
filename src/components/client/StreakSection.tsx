'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { isRiveFile } from '@/lib/utils/fileTypes'
import SimpleRiveLoop from './SimpleRiveLoop'
import { motion } from 'framer-motion'

export type StreakStage = {
  image: string
  stage: string
  progress: number
  nextGoal?: number
  nextReward?: string
  canRestart?: boolean
  isCompleted?: boolean
}

type Props = {
  currentCount: number
  isLoading?: boolean
}

interface StreakPrize {
  id: string
  name: string
  streak_threshold: number | null
  image_url: string | null
}

interface SystemSettings {
  streak_initial_image?: string
  streak_progress_default?: string
  streak_complete_image?: string
  company_theme_primary?: string
}

// ✨ Función para calcular el stage basado en el currentCount y premios
function calculateStreakStage(currentCount: number, prizes: StreakPrize[], settings: SystemSettings | undefined): StreakStage {
  const defaultImages = {
    initial: "🔥",
    progress: "🚀", 
    complete: "🏆"
  }

  // Filtrar premios válidos (con threshold no nulo)
  const validPrizes = prizes.filter(p => p.streak_threshold !== null && p.streak_threshold > 0)
    .sort((a, b) => (a.streak_threshold || 0) - (b.streak_threshold || 0))

  if (currentCount === 0) {
    // 🎯 INICIO: Siempre mostrar imagen inicial (no del premio)
    const image = settings?.streak_initial_image || defaultImages.initial
    const firstPrize = validPrizes[0]
    
    return {
      image,
      stage: "¡Comienza tu racha!",
      progress: 0,
      nextGoal: firstPrize?.streak_threshold || 3,
      nextReward: firstPrize?.name || "Premio sorpresa"
    }
  }

  // Encontrar siguiente premio
  const nextPrize = validPrizes.find(p => (p.streak_threshold || 0) > currentCount)
  
  if (!nextPrize) {
    return {
      image: settings?.streak_complete_image || defaultImages.complete,
      stage: "¡Racha completa!",
      progress: 100,
      isCompleted: true
    }
  }

  // Calcular progreso
  const previousThreshold = validPrizes
    .filter(p => (p.streak_threshold || 0) <= currentCount)
    .sort((a, b) => (b.streak_threshold || 0) - (a.streak_threshold || 0))[0]?.streak_threshold || 0

  const nextThreshold = nextPrize.streak_threshold || 0
  const progress = ((currentCount - previousThreshold) / (nextThreshold - previousThreshold)) * 100

  // 🎯 Encontrar el último premio alcanzado para mostrar su imagen
  const lastAchievedPrize = validPrizes
    .filter(p => (p.streak_threshold || 0) <= currentCount)
    .sort((a, b) => (b.streak_threshold || 0) - (a.streak_threshold || 0))[0]

  // 🎯 Usar imagen del último premio alcanzado (si tiene), sino imagen de progreso por defecto
  const image = (lastAchievedPrize?.image_url && lastAchievedPrize.image_url.trim() !== '') 
    ? lastAchievedPrize.image_url 
    : settings?.streak_progress_default || defaultImages.progress

  return {
    image,
    stage: `¡Vas por buen camino!`,
    progress: Math.min(progress, 100),
    nextGoal: nextThreshold,
    nextReward: nextPrize.name
  }
}

// 🔍 Custom comparison function para debugging
const areStreakPropsEqual = (prevProps: Props, nextProps: Props) => {
  console.log('🔍 React.memo comparación ejecutada:', {
    prevCount: prevProps.currentCount,
    nextCount: nextProps.currentCount,
    prevLoading: prevProps.isLoading,
    nextLoading: nextProps.isLoading
  })
  
  const areEqual = prevProps.currentCount === nextProps.currentCount && 
                   prevProps.isLoading === nextProps.isLoading;
  
  if (!areEqual) {
    console.log('🔍 StreakSection props changed:', {
      currentCountChanged: prevProps.currentCount !== nextProps.currentCount,
      isLoadingChanged: prevProps.isLoading !== nextProps.isLoading,
      prevCount: prevProps.currentCount,
      nextCount: nextProps.currentCount,
      prevLoading: prevProps.isLoading,
      nextLoading: nextProps.isLoading
    });
  } else {
    console.log('🔍 StreakSection memo: props IDENTICAL - skipping render');
  }
  
  return areEqual;
};

const StreakSectionComponent = memo(function StreakSection({ currentCount, isLoading: externalLoading }: Props) {
  console.log('🔍 StreakSection render:', { currentCount, externalLoading });
  console.log('🔍 StreakSection - RENDERIZADO CON currentCount:', currentCount, 'type:', typeof currentCount);
  
  // 🔍 LOG DETALLADO: Comparación de props
  console.log('🟨 STREAKSECTION PROPS RECIBIDOS:', {
    currentCount: currentCount,
    currentCountType: typeof currentCount,
    externalLoading: externalLoading,
    timestamp: new Date().toLocaleTimeString()
  });
  
  const [imageLoading, setImageLoading] = useState(false)
  const [previousImageUrl, setPreviousImageUrl] = useState<string>('')
  
  // 🔄 CAMBIO SEGURO: Usar Redux para streakPrizes (datos estáticos)
  const streakPrizes = useSelector((state: RootState) => state.auth.streakPrizes)
  
  // ⚠️ MANTENER: useSystemSettings por precaución (datos dinámicos)
  const { data: settings, isLoading: settingsLoading } = useSystemSettings()
  
  // 🔄 Local state solo para errores (no loading de prizes)
  const [error] = useState<string | null>(null)

  // 🔧 OPTIMIZADO: Memoizar solo las propiedades que necesitamos para evitar re-renders
  const stableSettings = useMemo(() => {
    if (!settings) return undefined
    return {
      streak_initial_image: settings.streak_initial_image,
      streak_progress_default: settings.streak_progress_default,
      streak_complete_image: settings.streak_complete_image,
      company_theme_primary: settings.company_theme_primary
    }
  }, [settings])
  
  console.log('🔍 StreakSection settings:', { 
    hasSettings: !!stableSettings, 
    settingsLoading,
    settingsKeys: stableSettings ? Object.keys(stableSettings).length : 0
  });

  // ✨ OPTIMIZACIÓN: Memoizar onError callbacks
  const handleRiveError = useCallback((src: string) => {
    console.error('❌ Error loading Rive animation:', src);
    setImageLoading(false);
  }, [])

  const handleImageError = useCallback(() => {
    setImageLoading(false);
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, [])

  // 🔄 ELIMINAR: Ya no necesitamos cargar prizes localmente (vienen de Redux)
  // useEffect para cargar prizes eliminado - ahora vienen de Redux store

  // ✨ Calcular el stage reactivamente cuando cambian los datos
  const streakStage = useMemo(() => {
    console.log('🔄 StreakSection useMemo[streakStage] triggered:', { 
      prizesLength: streakPrizes.length, 
      hasSettings: !!stableSettings, 
      currentCount 
    });
    if (streakPrizes.length > 0 && stableSettings) {
      return calculateStreakStage(currentCount, streakPrizes, stableSettings)
    }
    return null
  }, [currentCount, streakPrizes, stableSettings]) // 🎯 OPTIMIZADO: Usa stableSettings

  // 💎 Calcular número máximo de threshold
  const maxThreshold = useMemo(() => {
    const validPrizes = streakPrizes.filter(p => p.streak_threshold !== null && p.streak_threshold > 0)
    return validPrizes.length > 0 ? Math.max(...validPrizes.map(p => p.streak_threshold || 0)) : 0
  }, [streakPrizes])

  // ✨ OPTIMIZACIÓN: Mover side-effects a useEffect
  useEffect(() => {
    if (streakStage && streakStage.image !== previousImageUrl) {
      const isNewImage = streakStage.image.startsWith('http') || streakStage.image.startsWith('/')
      setImageLoading(isNewImage) // Solo loading si es imagen real (no emoji)
      setPreviousImageUrl(streakStage.image)
    }
  }, [streakStage, previousImageUrl])

  // ✨ OPTIMIZACIÓN: Memoizar solo la imagen para key estable
  const stableImageKey = useMemo(() => {
    const key = streakStage?.image || '';
    console.log('🔍 stableImageKey calculated:', key);
    return key;
  }, [streakStage?.image])

    // 🔄 NUEVO: Solo settingsLoading (prizesLoading eliminado - vienen de Redux)
  const isLoading = externalLoading || settingsLoading
  
  // 🎨 PASO 2: Reemplazar skeleton con Framer Motion (como CouponsView)
  if (isLoading) {
    return (
      <motion.div 
        className="px-4 max-w-lg mx-auto relative overflow-hidden rounded-2xl border border-gray-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* 🎨 Placeholder bonito sin skeleton molesto */}
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center justify-center">
            <div className="w-full aspect-square bg-gray-100 rounded-xl"></div>
          </div>
          <div className="flex flex-col justify-center space-y-2">
            <div className="text-5xl font-bold text-gray-300">--</div>
            <div className="text-base text-gray-400">Cargando...</div>
          </div>
        </div>
      </motion.div>
    )
  }

  // 🎯 Error handling
  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-red-200 p-6">
        <div className="text-center text-red-600">
          Error cargando datos de racha. Intenta de nuevo.
        </div>
      </div>
    )
  }

  // 🎯 Si llegamos aquí, deberíamos tener datos (React Query funcionando)
  if (!streakStage) {
    console.warn('⚠️ streakStage es null pero no estamos loading - posible issue de React Query')
    return (
      <div className="relative overflow-hidden rounded-2xl p-6">
        <div className="text-center text-gray-500">
          Reintentando carga de datos...
        </div>
      </div>
    )
  }

  const primaryColor = settings?.company_theme_primary || '#D73527'

  return (
    <div className="px-4 max-w-lg mx-auto relative overflow-hidden rounded-2xl">
      {/* 🎨 NUEVO DISEÑO: 2 columnas */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* 🖼️ Columna Izquierda: Imagen/Animación */}
        <div className="flex items-center justify-center">
          {(streakStage.image.startsWith('http') || streakStage.image.startsWith('/')) ? (
            <>
              {isRiveFile(streakStage.image) ? (
                // 🎭 Renderizar animación Rive
                <SimpleRiveLoop 
                  key={stableImageKey}
                  src={streakStage.image} 
                  className="w-full aspect-square rounded-xl overflow-hidden"
                  onError={handleRiveError}
                />
              ) : (
                // 🖼️ Renderizar imagen normal con efecto 3D sutil
                <div className="relative w-full aspect-square overflow-hidden">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full animate-spin"></div>
                    </div>
                  )}
                  <motion.div
                    animate={{
                      y: [0, -12, 0, -6, 0],
                      rotateX: [0, 8, 0, -8, 0, 4, 0],
                      rotateY: [0, 12, 0, -12, 0, 6, 0],
                      rotateZ: [0, 2, 0, -2, 0],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ 
                      transformStyle: "preserve-3d",
                      perspective: "800px"
                    }}
                    className="w-full h-full"
                  >
                    <Image 
                      src={streakStage.image} 
                      alt="Racha" 
                      fill
                      className={`object-contain transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      priority={true}
                    />
                  </motion.div>
                </div>
              )}
            </>
          ) : (
            // 😀 Emoji fallback
            <div className="text-6xl text-center p-6 bg-gray-50 rounded-xl">{streakStage.image}</div>
          )}
        </div>

        {/* 📊 Columna Derecha: Stats */}
        <div className="flex flex-col justify-center">
          {/* Número de racha con máximo - Formato: 0/20 */}
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {currentCount}
            {maxThreshold > 0 && (
              <span className="text-gray-900 font-regular">/{maxThreshold}</span>
            )}
          </div>
          
          {/* Texto "Racha actual" */}
          <div className="text-base text-gray-800 font-medium">
            Racha actual
          </div>

          {/* Botón de reiniciar si la racha está completa */}
          {streakStage.canRestart && !error && (
            <div className="mt-4">
              <button 
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors text-white"
                style={{ 
                  backgroundColor: primaryColor
                }}
              >
                ¡Empezar nueva racha!
              </button>
            </div>
          )}

          {/* Botón de recargar si hay error de datos */}
          {error && (
            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-gray-500 text-white hover:bg-gray-600"
              >
                Recargar página
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}, areStreakPropsEqual);

export const StreakSection = StreakSectionComponent;

// Temporalmente sin memo para debug
// export const StreakSection = memo(StreakSectionComponent, areStreakPropsEqual);
