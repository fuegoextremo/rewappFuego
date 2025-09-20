'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import React from 'react'
import { useUser } from '@/store/hooks'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { useAdvancedStreaks } from '@/hooks/useAdvancedStreaks'
import { useStreakPrizesRedux } from '@/hooks/useReduxStreaks'

interface StreakPrizesProgressProps {
  maxItems?: number
}

export function StreakPrizesProgress({ maxItems = 5 }: StreakPrizesProgressProps) {
  const user = useUser()
  const { data: settings } = useSystemSettings()
  const { data: streakPrizes, isLoading } = useStreakPrizesRedux()
  
  const currentStreak = user?.current_streak || 0
  const primaryColor = settings?.company_theme_primary || '#D73527'
  const lastCheckinDate = user?.streakData?.last_check_in
  const streakBreakDays = settings?.streak_break_days || 12

  // Calcular días hasta que se rompa la racha
  const daysUntilStreakBreaks = useMemo(() => {
    // Solución temporal: Si no tenemos lastCheckinDate pero sí una racha activa,
    // mostrar los días configurados del sistema
    if (currentStreak === 0) return null
    
    if (!lastCheckinDate) {
      // Sin fecha específica, mostrar los días configurados por defecto
      return Number(streakBreakDays) || 12
    }
    
    const lastCheckin = new Date(lastCheckinDate)
    const today = new Date()
    const daysSinceLastCheckin = Math.floor((today.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24))
    const daysUntilBreak = Number(streakBreakDays) - daysSinceLastCheckin
    
    return Math.max(0, daysUntilBreak)
  }, [lastCheckinDate, currentStreak, streakBreakDays])

  // Filtrar y ordenar premios válidos
  const validPrizes = useMemo(() => {
    if (!streakPrizes || !Array.isArray(streakPrizes)) return []
    
    return streakPrizes
      .filter(prize => prize.streak_threshold && prize.streak_threshold > 0)
      .sort((a, b) => (a.streak_threshold || 0) - (b.streak_threshold || 0))
  }, [streakPrizes])

  // Algoritmo de ventana deslizante inteligente
  const displayPrizes = useMemo(() => {
    if (validPrizes.length === 0) return []
    if (validPrizes.length <= maxItems) return validPrizes

    // Encontrar el índice del próximo premio no alcanzado
    const nextUnreachedIndex = validPrizes.findIndex(
      prize => (prize.streak_threshold || 0) > currentStreak
    )

    let startIndex = 0
    
    if (nextUnreachedIndex === -1) {
      // Todos los premios alcanzados, mostrar los últimos 5
      startIndex = Math.max(0, validPrizes.length - maxItems)
    } else if (nextUnreachedIndex < maxItems - 1) {
      // Próximo premio está en los primeros, mostrar desde el inicio
      startIndex = 0
    } else {
      // Centrar ventana alrededor del próximo premio
      startIndex = Math.max(0, nextUnreachedIndex - Math.floor(maxItems / 2))
      // Ajustar si nos pasamos del final
      startIndex = Math.min(startIndex, validPrizes.length - maxItems)
    }

    return validPrizes.slice(startIndex, startIndex + maxItems)
  }, [validPrizes, currentStreak, maxItems])

  // Calcular progreso de la barra proporcional
  const progressData = useMemo(() => {
    if (displayPrizes.length === 0) return { percentage: 0, total: 0 }

    const firstThreshold = displayPrizes[0].streak_threshold || 0
    const lastThreshold = displayPrizes[displayPrizes.length - 1].streak_threshold || 0
    const total = lastThreshold - firstThreshold

    if (total === 0) return { percentage: 100, total }

    // Calcular progreso desde el primer premio hasta el actual
    const progress = Math.max(0, currentStreak - firstThreshold)
    const percentage = Math.min(100, (progress / total) * 100)

    return { percentage, total }
  }, [displayPrizes, currentStreak])

  if (isLoading) {
    return (
      <div className="px-4 mb-6">
        <div className="bg-white p-4 shadow-sm animate-pulse">
          <div className="flex justify-between gap-3 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-[10px] mb-2"></div>
                <div className="w-6 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (displayPrizes.length === 0) {
    return null
  }

  return (
    <div className="px-4 mb-6">
        {/* Grid de premios */}
        <div className="flex justify-between gap-3 mb-4">
          {displayPrizes.map((prize) => {
            const isAchieved = currentStreak >= (prize.streak_threshold || 0)
            const hasImage = prize.image_url && prize.image_url.trim() !== ''

            return (
              <div key={prize.id} className="flex flex-col items-center">
                {/* Imagen del premio */}
                <div className={`
                  w-10 h-10 rounded-[10px] overflow-hidden bg-gray-100 
                  flex items-center justify-center mb-2
                  ${!isAchieved ? 'grayscale' : ''}
                `}>
                  {hasImage ? (
                    <Image
                      src={prize.image_url!}
                      alt={prize.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-lg">🏆</div>
                  )}
                </div>
                
                {/* Número de racha requerida */}
                <div className={`
                  text-xs font-medium
                  ${isAchieved ? 'text-gray-900' : 'text-gray-500'}
                `}>
                  {prize.streak_threshold}
                </div>
              </div>
            )
          })}
        </div>

        {/* Barra de progreso unificada */}
        <div className="relative">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${progressData.percentage}%`,
                backgroundColor: primaryColor
              }}
            />
          </div>
          
          {/* Marcadores de posición (invisibles pero ayudan con el posicionamiento) */}
          <div className="absolute top-0 w-full h-2 flex justify-between">
            {displayPrizes.map((_, index) => (
              <div key={index} className="w-px h-full"></div>
            ))}
          </div>
        </div>

        {/* Mensaje de días restantes para mantener la racha */}
        {daysUntilStreakBreaks !== null && daysUntilStreakBreaks > 0 && currentStreak > 0 && (
          <div className="mt-8 text-center">
            <p 
              className="text-sm font-medium"
              style={{ color: `${primaryColor}B3` }} // B3 = 70% opacity in hex
            >
              Visita antes de <strong>{daysUntilStreakBreaks}d</strong> para no perder la racha
            </p>
          </div>
        )}
    </div>
  )
}