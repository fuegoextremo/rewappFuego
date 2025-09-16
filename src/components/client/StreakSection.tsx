'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import Image from 'next/image'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { createClientBrowser } from '@/lib/supabase/client'
import { isRiveFile } from '@/lib/utils/fileTypes'
import SimpleRiveLoop from './SimpleRiveLoop'

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
  
  const [imageLoading, setImageLoading] = useState(false)
  const [previousImageUrl, setPreviousImageUrl] = useState<string>('')
  const [streakPrizes, setStreakPrizes] = useState<StreakPrize[]>([])
  const [prizesLoading, setPrizesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: settings, isLoading: settingsLoading } = useSystemSettings()
  
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

  // ✨ Cargar premios de racha una sola vez (datos semi-estáticos)
  useEffect(() => {
    let isMounted = true
    
    async function loadPrizes() {
      try {
        const supabase = createClientBrowser()
        const { data: prizes, error: prizesError } = await supabase
          .from('prizes')
          .select('id, name, streak_threshold, image_url')
          .eq('type', 'streak')
          .eq('is_active', true)
          .order('streak_threshold', { ascending: true })

        if (prizesError) throw prizesError
        
        if (isMounted) {
          setStreakPrizes(prizes || [])
          setPrizesLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error loading prizes')
          setPrizesLoading(false)
        }
      }
    }

    loadPrizes()
    return () => { isMounted = false }
  }, [])

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

  // Loading states
  const isLoading = externalLoading || settingsLoading || prizesLoading
  
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6">
        <div className="animate-pulse space-y-6">
          <div className="text-center">
            <div className="h-32 bg-gray-100 rounded-xl mx-auto w-full"></div>
          </div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded-lg mx-auto w-3/4"></div>
            <div className="h-6 bg-gray-150 rounded-lg mx-auto w-1/2"></div>
          </div>
          <div className="h-20 bg-gray-100 rounded-xl w-full"></div>
        </div>
      </div>
    )
  }

  // 🎯 Error handling
  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white border border-red-200 p-6">
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
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          Reintentando carga de datos...
        </div>
      </div>
    )
  }

  const primaryColor = settings?.company_theme_primary || '#D73527'

  return (
    <div className={`relative overflow-hidden rounded-2xl ${
      streakStage.stage.includes('perdida') 
        ? 'bg-white text-gray-700' 
        : 'bg-white text-gray-900'
    }`}>

      {/* Imagen/Icono de la racha */}
      <div className="relative z-10 mb-6">
        {/* 🎯 Detección automática: Rive vs Imagen normal */}
        {(streakStage.image.startsWith('http') || streakStage.image.startsWith('/')) ? (
          <>
            {isRiveFile(streakStage.image) ? (
              // 🎭 Renderizar animación Rive SIN AnimatePresence
              <SimpleRiveLoop 
                key={stableImageKey} // ✨ Key estable basado solo en la imagen
                src={streakStage.image} 
                className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50"
                onError={handleRiveError}
              />
            ) : (
              // 🖼️ Renderizar imagen normal
              <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  </div>
                )}
                <Image 
                  src={streakStage.image} 
                  alt="Racha" 
                  fill
                  className={`object-cover transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  priority={true}
                />
              </div>
            )}
          </>
        ) : (
          // 😀 Emoji fallback
          <div className="text-6xl text-center p-6 bg-gray-50">{streakStage.image}</div>
        )}
      </div>

      {/* Contenido */}
      <div className="relative z-10 p-6 pt-0">
        {/* Título y descripción */}
        <div className="text-center mb-6">
          <h3 className={`text-xl font-bold mb-2 ${
            streakStage.stage.includes('perdida') ? 'text-gray-700' : 'text-gray-900'
          }`}>{streakStage.stage}</h3>
          {streakStage.nextReward && (
            <p className={`text-sm ${
              streakStage.stage.includes('perdida') ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Próximo premio: <span style={{color:primaryColor}} className="font-semibold">{streakStage.nextReward}</span>
            </p>
          )}
        </div>

        {/* Barra de progreso */}
        {streakStage.nextGoal && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{currentCount} visitas</span>
              <span>{streakStage.nextGoal} visitas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${streakStage.progress}%`,
                  backgroundColor: primaryColor
                }}
              ></div>
            </div>
            <div className="text-center text-xs text-gray-500">
              {Math.round(streakStage.progress)}% completado
            </div>
          </div>
        )}

        {/* Botón de reiniciar si la racha está completa */}
        {streakStage.canRestart && !error && (
          <div className="text-center mt-4">
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
          <div className="text-center mt-4">
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
  )
}, areStreakPropsEqual);

export const StreakSection = StreakSectionComponent;
