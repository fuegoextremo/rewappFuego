'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAppSettings } from '@/stores/app-store'
import { createClientBrowser } from '@/lib/supabase/client'

type StreakPrize = {
  id: string
  name: string
  description: string | null
  streak_threshold: number | null
  image_url: string | null
  validity_days: number | null
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
  currentCount: number
  userId: string
}

// Fallback images
const FALLBACK_IMAGES = {
  streak_initial: "🔥", 
  streak_progress: "🚀", 
  streak_complete: "🏆",
  streak_expired: "😴"
}

function calculateStreakStage(currentCount: number, prizes: StreakPrize[], settings: Record<string, string>): StreakStage {
  if (currentCount === 0) {
    return {
      image: settings?.streak_initial_image || FALLBACK_IMAGES.streak_initial,
      stage: "¡Comienza tu racha!",
      progress: 0,
      nextGoal: prizes[0]?.streak_threshold || 5,
      nextReward: prizes[0]?.name || "Premio sorpresa"
    }
  }

  // Encontrar el siguiente objetivo
  const nextPrize = prizes.find(p => (p.streak_threshold || 0) > currentCount)
  
  if (!nextPrize) {
    // Ha completado todos los objetivos
    return {
      image: settings?.streak_complete_image || FALLBACK_IMAGES.streak_complete,
      stage: "¡Racha completa!",
      progress: 100,
      isCompleted: true
    }
  }

  // Calcular progreso hacia el siguiente objetivo
  const previousThreshold = prizes
    .filter(p => (p.streak_threshold || 0) <= currentCount)
    .sort((a, b) => (b.streak_threshold || 0) - (a.streak_threshold || 0))[0]?.streak_threshold || 0

  const progress = ((currentCount - previousThreshold) / ((nextPrize.streak_threshold || 0) - previousThreshold)) * 100

  return {
    image: settings?.streak_progress_default || FALLBACK_IMAGES.streak_progress,
    stage: `¡Vas por buen camino!`,
    progress: Math.min(progress, 100),
    nextGoal: nextPrize.streak_threshold || 0,
    nextReward: nextPrize.name || "Premio sorpresa"
  }
}

export function StoreStreakSection({ currentCount, userId }: Props) {
  const [streakStage, setStreakStage] = useState<StreakStage | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState(true)
  const settings = useAppSettings()

  useEffect(() => {
    async function loadStreakStage() {
      setLoading(true)
      console.log('🎯 Cargando StreakSection para usuario:', userId, 'count:', currentCount)
      
      try {
        const supabase = createClientBrowser()
        
        // Obtener premios de racha
        console.log('📥 Obteniendo premios de racha...')
        const { data: streakPrizes, error } = await supabase
          .from('prizes')
          .select('id, name, description, streak_threshold, image_url, validity_days')
          .eq('type', 'streak')
          .eq('is_active', true)
          .order('streak_threshold', { ascending: true })

        if (error) {
          console.error('❌ Error obteniendo premios de racha:', error)
          // Fallback con datos básicos
          setStreakStage({
            image: FALLBACK_IMAGES.streak_initial,
            stage: "¡Comienza tu racha!",
            progress: currentCount > 0 ? Math.min((currentCount / 7) * 100, 100) : 0,
            nextGoal: 7,
            nextReward: "Premio sorpresa"
          })
          setLoading(false)
          return
        }

        console.log('✅ Premios obtenidos:', streakPrizes?.length || 0)

        // Verificar estado de la racha del usuario
        console.log('📥 Verificando estado de racha del usuario...')
        const { data: userStreak, error: streakError } = await supabase
          .from('streaks')
          .select('current_count, expires_at, last_check_in')
          .eq('user_id', userId)
          .single()

        if (streakError && streakError.code !== 'PGRST116') { // PGRST116 = no rows
          console.error('❌ Error obteniendo racha del usuario:', streakError)
        }

        console.log('📊 Estado de racha del usuario:', userStreak)

        // Verificar si la racha ha expirado
        const isExpired = userStreak?.expires_at ? 
          new Date(userStreak.expires_at) < new Date() : false

        console.log('⏰ Racha expirada:', isExpired)

        if (isExpired) {
          setStreakStage({
            image: settings?.streak_initial_image || FALLBACK_IMAGES.streak_initial,
            stage: "¡Nuevo periodo de rachas!",
            progress: 0,
            nextGoal: streakPrizes?.[0]?.streak_threshold || 5,
            nextReward: streakPrizes?.[0]?.name || "Premio sorpresa",
            canRestart: true
          })
        } else {
          const stage = calculateStreakStage(currentCount, streakPrizes || [], settings)
          console.log('🎯 Etapa calculada:', stage)
          setStreakStage(stage)
        }

      } catch (error) {
        console.error('❌ Error cargando etapa de racha:', error)
        setStreakStage({
          image: FALLBACK_IMAGES.streak_initial,
          stage: "Error cargando racha",
          progress: 0
        })
      } finally {
        console.log('✅ StreakSection carga completada')
        setLoading(false)
      }
    }

    loadStreakStage()
  }, [currentCount, userId, settings])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!streakStage) return null

  const primaryColor = settings.company_theme_primary || '#D73527'

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Racha Actual</h3>
          <p className="text-sm text-gray-600">{streakStage.stage}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: primaryColor }}>
            {currentCount}
          </div>
          <div className="text-xs text-gray-500">días seguidos</div>
        </div>
      </div>

      {/* Imagen de la racha */}
      <div className="text-center mb-4">
        {streakStage.image.startsWith('http') ? (
          <div className="relative w-16 h-16 mx-auto">
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse"></div>
            )}
            <Image
              src={streakStage.image}
              alt="Imagen de racha"
              width={64}
              height={64}
              className="rounded-full"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </div>
        ) : (
          <div className="text-4xl">{streakStage.image}</div>
        )}
      </div>
      
      {/* Barra de progreso */}
      {!streakStage.isCompleted && streakStage.nextGoal && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso hacia {streakStage.nextGoal} días</span>
            <span>{Math.round(streakStage.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${streakStage.progress}%`,
                background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`
              }}
            />
          </div>
          {streakStage.nextReward && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Próximo premio: {streakStage.nextReward}
            </p>
          )}
        </div>
      )}

      {/* Estado especial para racha completa */}
      {streakStage.isCompleted && (
        <div className="text-center py-4 bg-green-50 rounded-lg">
          <p className="text-green-700 font-medium">¡Felicidades!</p>
          <p className="text-sm text-green-600">Has completado todos los objetivos de racha</p>
        </div>
      )}

      {/* Botón de reinicio si es necesario */}
      {streakStage.canRestart && (
        <div className="text-center py-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700 font-medium">¡Nuevo periodo disponible!</p>
          <p className="text-sm text-blue-600">Haz un check-in para comenzar tu nueva racha</p>
        </div>
      )}
    </div>
  )
}
