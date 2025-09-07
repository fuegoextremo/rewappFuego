'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { useStreakStage } from '@/hooks/queries/useStreakQueries'

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

export function StreakSection({ userId, currentCount, isLoading: externalLoading }: Props) {
  const [imageLoading, setImageLoading] = useState(false) // ✨ Optimistic loading - confiamos en browser cache
  const [previousImageUrl, setPreviousImageUrl] = useState<string>('')
  const { data: settings, isLoading: settingsLoading } = useSystemSettings() // ✨ React Query con cache agresivo
  const { data: streakStage, isLoading: stageLoading, error } = useStreakStage(userId, settings)

  // 🎯 LOADING INTELIGENTE: Solo mostrar skeleton si NO tenemos datos Y estamos cargando
  const hasSettings = !!settings
  const hasStreakData = !!streakStage
  const isActuallyLoading = (settingsLoading && !hasSettings) || (stageLoading && !hasStreakData)
  const shouldShowSkeleton = isActuallyLoading || (!hasStreakData && !error && !externalLoading)

  // 🎯 Skeleton solo cuando REALMENTE no tenemos datos críticos
  if (shouldShowSkeleton) {
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

  // ✨ Optimistic image loading - solo mostrar loading para imágenes nuevas
  if (streakStage.image !== previousImageUrl) {
    const isNewImage = streakStage.image.startsWith('http') || streakStage.image.startsWith('/')
    setImageLoading(isNewImage) // Solo loading si es imagen real (no emoji)
    setPreviousImageUrl(streakStage.image)
  }

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
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              priority={true}
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
