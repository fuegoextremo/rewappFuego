'use client'

import { useMemo } from 'react'
import { useUserStreakRedux, useStreakPrizesRedux } from './useReduxStreaks'
import { calculateStreakStageAdvanced, type AdvancedStreakStage } from '@/lib/services/streaks'
import { useSystemSettings } from './use-system-settings'

/**
 * 🔥 Hook completo para manejo avanzado de rachas con lógica de completación
 * Integra Redux, cálculo de estados y manejo de rachas completadas
 */
export function useAdvancedStreaks(userId: string) {
  // Datos de Redux
  const { data: streakDataRedux, isLoading: streakLoading } = useUserStreakRedux(userId)
  const { data: streakPrizes, isLoading: prizesLoading } = useStreakPrizesRedux()
  const { data: settings, isLoading: settingsLoading } = useSystemSettings()

  // Estado de carga
  const isLoading = streakLoading || prizesLoading || settingsLoading

  // Calcular estado avanzado de racha
  const advancedStreakStage: AdvancedStreakStage | null = useMemo(() => {
    if (!streakDataRedux?.rawData || !streakPrizes || !settings) {
      return null
    }

    const streakData = {
      current_count: streakDataRedux.currentCount,
      completed_count: streakDataRedux.completedCount || 0,
      is_just_completed: streakDataRedux.isJustCompleted || false,
      expires_at: streakDataRedux.expiresAt,
      last_check_in: streakDataRedux.lastCheckIn
    }

    return calculateStreakStageAdvanced(streakData, streakPrizes, settings)
  }, [streakDataRedux, streakPrizes, settings])

  // Datos de racha para compatibilidad
  const streakData = streakDataRedux ? {
    currentCount: streakDataRedux.currentCount,
    completedCount: streakDataRedux.completedCount || 0,
    isJustCompleted: streakDataRedux.isJustCompleted || false,
    expiresAt: streakDataRedux.expiresAt,
    lastCheckIn: streakDataRedux.lastCheckIn
  } : null

  return {
    // Estado de carga
    isLoading,
    
    // Datos de racha
    streakData,
    
    // Estado avanzado calculado
    streakStage: advancedStreakStage,
    
    // Premios disponibles
    streakPrizes: streakPrizes || [],
    
    // Configuración del sistema
    settings,
    
    // Helpers para UI
    helpers: {
      showCompletedBadge: advancedStreakStage?.showCompletedBadge || false,
      canRestart: advancedStreakStage?.canRestart || false,
      isCompleted: advancedStreakStage?.isCompleted || false,
      isJustCompleted: advancedStreakStage?.isJustCompleted || false,
      seasonsCompleted: advancedStreakStage?.seasonsCompleted || 0
    }
  }
}

export type UseAdvancedStreaksReturn = ReturnType<typeof useAdvancedStreaks>
