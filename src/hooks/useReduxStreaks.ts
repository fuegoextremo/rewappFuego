'use client'

import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { 
  loadRecentActivity, 
  loadStreakPrizes, 
  loadUserStreakData,
  type StreakPrize
} from '@/store/slices/authSlice'
import type { RootState } from '@/store'

// 🔥 Hook que reemplaza useUserStreak de React Query
export function useUserStreakRedux(userId: string) {
  const dispatch = useAppDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  
  // 🔍 Debug logging
  console.log('🔍 useUserStreakRedux:', { 
    userId, 
    hasStreakData: !!user?.streakData,
    userIdMatch: user?.id === userId
  })
  
  // Cargar datos si:
  // 1. Hay userId
  // 2. NO hay datos de streak O el usuario cambió (para evitar datos cached)
  useEffect(() => {
    if (userId && (!user?.streakData || user.id !== userId)) {
      console.log('🔄 Dispatching loadUserStreakData for userId:', userId)
      dispatch(loadUserStreakData(userId))
    }
  }, [userId, user?.streakData, user?.id, dispatch])
  
  const streakData = user?.streakData
  
  return {
    data: streakData ? {
      currentCount: streakData.current_count,
      completedCount: streakData.completed_count,        // 🆕 Contador de completadas
      isJustCompleted: streakData.is_just_completed,     // 🆕 Flag temporal UI
      expiresAt: streakData.expires_at,
      lastCheckIn: streakData.last_check_in,
      rawData: streakData
    } : undefined,
    isLoading: !streakData && !!userId, // Loading si hay userId pero no datos
    error: null // TODO: Manejar errores si es necesario
  }
}

// 🔥 Hook que reemplaza useStreakPrizes de React Query
export function useStreakPrizesRedux() {
  const dispatch = useAppDispatch()
  const { streakPrizes, streakPrizesLoaded } = useSelector((state: RootState) => state.auth)
  
  // Cargar premios si no están cargados
  useEffect(() => {
    if (!streakPrizesLoaded) {
      dispatch(loadStreakPrizes())
    }
  }, [streakPrizesLoaded, dispatch])
  
  return {
    data: streakPrizes,
    isLoading: !streakPrizesLoaded,
    error: null // TODO: Manejar errores si es necesario
  }
}

// 🔥 Hook que reemplaza useRecentActivity de React Query  
export function useRecentActivityRedux(userId: string) {
  const dispatch = useAppDispatch()
  const { recentActivity, recentActivityLoading, recentActivityError, recentActivityLoaded } = useSelector((state: RootState) => state.auth)
  
  // 🔍 Debug logging mejorado
  console.log('🔍 useRecentActivityRedux:', { 
    userId, 
    recentActivityLoaded, 
    recentActivityLoading,
    dataCount: recentActivity.length,
    shouldLoad: userId && !recentActivityLoaded && !recentActivityLoading
  })
  
  // Cargar actividad si:
  // 1. Hay userId
  // 2. NO se ha cargado antes (sin importar si el resultado está vacío)
  // 3. NO se está cargando actualmente
  useEffect(() => {
    if (userId && !recentActivityLoaded && !recentActivityLoading) {
      console.log('🔄 Dispatching loadRecentActivity for userId:', userId)
      dispatch(loadRecentActivity(userId))
    }
  }, [userId, recentActivityLoaded, recentActivityLoading, dispatch])
  
  return {
    data: recentActivity,
    isLoading: recentActivityLoading,
    error: recentActivityError
  }
}

// 🔥 Hook que reemplaza useStreakStage - AHORA CALCULADO EN TIEMPO REAL
export function useStreakStageRedux() {
  const user = useSelector((state: RootState) => state.auth.user)
  const streakPrizes = useSelector((state: RootState) => state.auth.streakPrizes)
  const settings = useSelector((state: RootState) => state.settings.settings)
  
  // Asegurar que tenemos los datos necesarios
  const streakData = user?.streakData
  const currentCount = streakData?.current_count || 0
  
  // Calcular stage en tiempo real (sin cache, siempre actualizado)
  const stage = calculateStreakStage(currentCount, streakPrizes, settings)
  
  return {
    data: stage,
    isLoading: false, // Calculado instantáneamente
    error: null
  }
}

// 🎯 Helper function para calcular el stage (movida de React Query)
function calculateStreakStage(
  currentCount: number, 
  streakPrizes: StreakPrize[], 
  settings: Record<string, string>
) {
  const FALLBACK_IMAGES = {
    streak_initial: "🔥", 
    streak_progress: "🚀", 
    streak_complete: "🏆",
    streak_expired: "😴"
  }

  const validPrizes = streakPrizes.filter(p => p.streak_threshold && p.streak_threshold > 0)
  
  if (currentCount === 0) {
    return {
      image: settings?.streak_initial_image || FALLBACK_IMAGES.streak_initial,
      stage: "¡Empieza tu primera visita!",
      progress: 0,
      nextGoal: validPrizes[0]?.streak_threshold || 5,
      nextReward: validPrizes[0]?.name || "Premio sorpresa"
    }
  }

  const currentThreshold = validPrizes.findLast((p: StreakPrize) => (p.streak_threshold || 0) <= currentCount)
  const nextThreshold = validPrizes.find((p: StreakPrize) => (p.streak_threshold || 0) > currentCount)

  if (nextThreshold) {
    const baseProgress = currentThreshold?.streak_threshold || 0
    const progressRange = (nextThreshold.streak_threshold || 0) - baseProgress
    const currentProgress = currentCount - baseProgress
    const progressPercentage = (currentProgress / progressRange) * 100

    return {
      image: currentThreshold?.image_url || 
             settings?.streak_progress_default || 
             FALLBACK_IMAGES.streak_progress,
      stage: `Racha activa: ${currentCount} visitas`,
      progress: Math.min(progressPercentage, 100),
      nextGoal: nextThreshold.streak_threshold || 0,
      nextReward: nextThreshold.name
    }
  }

  return {
    image: settings?.streak_complete_image || FALLBACK_IMAGES.streak_complete,
    stage: "¡Racha máxima completada!",
    progress: 100,
    canRestart: true,
    isCompleted: true
  }
}
