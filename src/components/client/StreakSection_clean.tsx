'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClientBrowser } from '@/lib/supabase/client'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { useStreakPrizes } from '@/hooks/queries/useStreakQueries'

type StreakPrize = {
  id: string
  name: string
  description: string | null
  streak_threshold: number | null
  image_url: string | null
  validity_days: number | null
}

type SystemSettings = {
  company_theme_primary?: string
  streak_initial_image?: string
  streak_progress_default?: string
  streak_complete_image?: string
}

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
  userId: string
  currentCount: number
  isLoading?: boolean
}

// Fallback images
const FALLBACK_IMAGES = {
  streak_initial: "🔥", 
  streak_progress: "🚀", 
  streak_complete: "🏆",
  streak_expired: "😴"
}

export function StreakSection({ userId, currentCount, isLoading: externalLoading }: Props) {
  const [streakStage, setStreakStage] = useState<StreakStage | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState(true)
  const { settings } = useSystemSettings()
  const { data: streakPrizes, isLoading: prizesLoading } = useStreakPrizes()

  // ✨ Combinar estados de loading
  const isActuallyLoading = externalLoading || prizesLoading || loading

  useEffect(() => {
    async function loadStreakStage() {
      // ✨ Verificar que tenemos los datos necesarios
      if (!settings || !streakPrizes) return
      
      setLoading(true)
      try {
        const supabase = createClientBrowser()

        // Obtener información de la racha del usuario
        const { data: userStreak } = await supabase
          .from('streaks')
          .select('current_count, expires_at, last_check_in')
          .eq('user_id', userId)
          .single()

        // CASO 1: Usuario completamente nuevo
        if (!userStreak) {
          const stage = calculateStreakStage(0, streakPrizes, settings)
          setStreakStage(stage)
          return
        }

        // CASO 2: Racha expirada
        const isExpired = userStreak?.expires_at ? 
          new Date(userStreak.expires_at) < new Date() : false

        if (isExpired) {
          setStreakStage({
            image: settings?.streak_initial_image || FALLBACK_IMAGES.streak_initial,
            stage: "¡Nuevo periodo de rachas!",
            progress: 0,
            nextGoal: streakPrizes?.[0]?.streak_threshold || 5,
            nextReward: streakPrizes?.[0]?.name || "Premio sorpresa",
            canRestart: true
          })
          return
        }

        // CASO 3: Racha rota por inactividad
        const breakDaysLimit = parseInt(settings?.streak_break_days || '12')
        const daysSinceLastCheckin = userStreak?.last_check_in ?
          Math.floor((new Date().getTime() - new Date(userStreak.last_check_in).getTime()) / (1000 * 60 * 60 * 24)) : 0
        const streakBroken = daysSinceLastCheckin > breakDaysLimit

        if (streakBroken) {
          setStreakStage({
            image: FALLBACK_IMAGES.streak_expired,
            stage: "Racha perdida - ¡Reinicia!",
            progress: 0,
            nextGoal: streakPrizes?.[0]?.streak_threshold || 5,
            nextReward: streakPrizes?.[0]?.name || "Premio sorpresa",
            canRestart: true
          })
          return
        }

        // CASO 4: Racha activa
        const actualCount = userStreak?.current_count || currentCount
        const stage = calculateStreakStage(actualCount, streakPrizes, settings)
        setStreakStage(stage)
      } catch (error) {
        console.error('Error cargando etapa de racha:', error)
        setStreakStage(getDefaultStreakStage(currentCount))
      } finally {
        setLoading(false)
      }
    }

    if (settings && streakPrizes) {
      loadStreakStage()
    }
  }, [userId, currentCount, settings, streakPrizes])

  // ✨ Usar el loading combinado
  if (isActuallyLoading) {
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

  if (!streakStage) return null

  const primaryColor = settings?.company_theme_primary || '#D73527'

  return (
    <div className={`relative overflow-hidden rounded-2xl ${
      streakStage.stage.includes('perdida') 
        ? 'bg-white text-gray-700' 
        : 'bg-white text-gray-900'
    }`}>

      {/* Imagen/Icono de la racha */}
      <div className="relative z-10 mb-6">
        {(streakStage.image.startsWith('http') || streakStage.image.startsWith('/')) ? (
          <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}
            <Image 
              src={streakStage.image} 
              alt="Racha" 
              fill
              className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              sizes="(max-width: 768px) 100vw, 50vw"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </div>
        ) : (
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
              Próximo premio: <span className="font-semibold text-blue-600">{streakStage.nextReward}</span>
            </p>
          )}
        </div>

        {/* Barra de progreso */}
        {!streakStage.isCompleted && streakStage.nextGoal && (
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
        {streakStage.canRestart && (
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
      </div>
    </div>
  )
}

// Lógica de cálculo de racha optimizada
function calculateStreakStage(
  currentCount: number, 
  streakPrizes: StreakPrize[], 
  settings: SystemSettings | null
): StreakStage {
  
  // Filtrar premios válidos 
  const validPrizes = streakPrizes.filter(p => p.streak_threshold && p.streak_threshold > 0)
  
  // Caso 1: Sin visitas
  if (currentCount === 0) {
    const firstThreshold = validPrizes[0]?.streak_threshold || 5
    return {
      image: settings?.streak_initial_image || FALLBACK_IMAGES.streak_initial,
      stage: "¡Empieza tu primera visita!",
      progress: 0,
      nextGoal: firstThreshold,
      nextReward: validPrizes[0]?.name || "Premio sorpresa"
    }
  }

  // Encontrar etapa actual y siguiente
  const currentThreshold = validPrizes.findLast((p: StreakPrize) => p.streak_threshold! <= currentCount)
  const nextThreshold = validPrizes.find((p: StreakPrize) => p.streak_threshold! > currentCount)

  // Caso 3: En progreso hacia siguiente meta
  if (nextThreshold) {
    const baseProgress = currentThreshold?.streak_threshold || 0
    const progressRange = nextThreshold.streak_threshold! - baseProgress
    const currentProgress = currentCount - baseProgress
    const progressPercentage = (currentProgress / progressRange) * 100

    return {
      image: currentThreshold?.image_url || 
             settings?.streak_progress_default || 
             FALLBACK_IMAGES.streak_progress,
      stage: `Racha activa: ${currentCount} visitas`,
      progress: Math.min(progressPercentage, 100),
      nextGoal: nextThreshold.streak_threshold!,
      nextReward: nextThreshold.name
    }
  }

  // Caso 4: Racha completa
  return {
    image: settings?.streak_complete_image || FALLBACK_IMAGES.streak_complete,
    stage: "¡Racha máxima completada!",
    progress: 100,
    canRestart: true,
    isCompleted: true
  }
}

// Fallback cuando hay errores
function getDefaultStreakStage(currentCount: number): StreakStage {
  if (currentCount === 0) {
    return {
      image: FALLBACK_IMAGES.streak_initial,
      stage: "¡Empieza tu primera visita!",
      progress: 0,
      nextGoal: 5
    }
  }

  return {
    image: FALLBACK_IMAGES.streak_progress,
    stage: `Racha activa: ${currentCount} visitas`,
    progress: (currentCount % 20) * 5,
    nextGoal: Math.ceil(currentCount / 5) * 5
  }
}
