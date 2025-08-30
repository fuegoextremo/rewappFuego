'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClientBrowser } from '@/lib/supabase/client'
import { useSystemSettings } from '@/hooks/use-system-settings'

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
}

// Fallback images
const FALLBACK_IMAGES = {
  streak_initial: "🔥", 
  streak_progress: "🚀", 
  streak_complete: "🏆",
  streak_expired: "😴" // Para rachas expiradas
}

export function StreakSection({ userId, currentCount }: Props) {
  const [streakStage, setStreakStage] = useState<StreakStage | null>(null)
  const [loading, setLoading] = useState(true)
  const { settings } = useSystemSettings()

  useEffect(() => {
    async function loadStreakStage() {
      setLoading(true)
      try {
        const supabase = createClientBrowser()
        
        // Obtener información de la racha del usuario (incluyendo expiración)
        const { data: userStreak } = await supabase
          .from('streaks')
          .select('current_count, expires_at, last_check_in')
          .eq('user_id', userId)
          .single()

        // Verificar si la racha ha expirado
        const isExpired = userStreak?.expires_at ? 
          new Date(userStreak.expires_at) < new Date() : false

        // Verificar si han pasado más días del configurado desde el último check-in
        const breakDaysLimit = parseInt(settings?.streak_break_days || '1')
        const daysSinceLastCheckin = userStreak?.last_check_in ?
          Math.floor((new Date().getTime() - new Date(userStreak.last_check_in).getTime()) / (1000 * 60 * 60 * 24)) : 999

        const streakBroken = daysSinceLastCheckin > breakDaysLimit

        // Obtener premios de racha ordenados
        const { data: streakPrizes, error } = await supabase
          .from('prizes')
          .select('id, name, description, streak_threshold, image_url, validity_days')
          .eq('type', 'streak')
          .eq('is_active', true)
          .order('streak_threshold', { ascending: true })

        if (error) {
          console.error('Error obteniendo premios de racha:', error)
          setStreakStage(getDefaultStreakStage(currentCount))
          return
        }

        // Si la racha ha expirado o se rompió, mostrar estado especial
        if (isExpired || streakBroken) {
          setStreakStage({
            image: FALLBACK_IMAGES.streak_expired,
            stage: isExpired ? "Racha expirada - ¡Comienza de nuevo!" : "Racha perdida - ¡Reinicia!",
            progress: 0,
            nextGoal: streakPrizes?.[0]?.streak_threshold || 5,
            nextReward: streakPrizes?.[0]?.name || "Premio sorpresa",
            canRestart: true
          })
          return
        }

        // Calcular la etapa de racha usando el count real de la base de datos
        const actualCount = userStreak?.current_count || currentCount
        const stage = calculateStreakStage(actualCount, streakPrizes || [], settings)
        setStreakStage(stage)
      } catch (error) {
        console.error('Error cargando etapa de racha:', error)
        setStreakStage(getDefaultStreakStage(currentCount))
      } finally {
        setLoading(false)
      }
    }

    if (settings) {
      loadStreakStage()
    }
  }, [userId, currentCount, settings])

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-20 bg-white/20 rounded-full mx-auto w-20"></div>
          <div className="h-3 bg-white/20 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!streakStage) return null

  const primaryColor = settings?.company_theme_primary || '#D73527'

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${
      streakStage.stage.includes('expirada') || streakStage.stage.includes('perdida') 
        ? 'bg-gradient-to-br from-gray-600 to-gray-700' 
        : 'bg-gradient-to-br from-gray-900 to-gray-800'
    }`}>
      {/* Efectos de partículas/fuego en el fondo */}
      <div className="absolute inset-0 opacity-20">
        {streakStage.stage.includes('expirada') || streakStage.stage.includes('perdida') ? (
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-400/30 to-transparent"></div>
        ) : (
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-orange-500/30 to-transparent"></div>
        )}
      </div>

      <div className="relative z-10">
        {/* Imagen/Icono de la racha */}
        <div className="text-center mb-6">
          {(streakStage.image.startsWith('http') || streakStage.image.startsWith('/')) ? (
            <Image 
              src={streakStage.image} 
              alt="Racha" 
              width={96}
              height={96}
              className="w-24 h-24 mx-auto rounded-full object-cover"
            />
          ) : (
            <div className="text-6xl mb-2">{streakStage.image}</div>
          )}
        </div>

        {/* Título y descripción */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">{streakStage.stage}</h3>
          {streakStage.nextReward && (
            <p className="text-white/80 text-sm">
              Próximo premio: <span className="font-semibold text-yellow-300">{streakStage.nextReward}</span>
            </p>
          )}
        </div>

        {/* Barra de progreso */}
        {!streakStage.isCompleted && streakStage.nextGoal && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/70">
              <span>{currentCount} visitas</span>
              <span>{streakStage.nextGoal} visitas</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${streakStage.progress}%`,
                  backgroundColor: primaryColor
                }}
              ></div>
            </div>
            <div className="text-center text-xs text-white/70">
              {Math.round(streakStage.progress)}% completado
            </div>
          </div>
        )}

        {/* Botón de reiniciar si la racha está completa */}
        {streakStage.canRestart && (
          <div className="text-center mt-4">
            <button 
              className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{ 
                backgroundColor: primaryColor,
                color: 'white'
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

// Lógica de cálculo de racha (movida al cliente)
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

  // Caso 2: Encontrar etapa actual y siguiente
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
