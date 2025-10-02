'use client'

import { useSelector, shallowEqual } from 'react-redux'
import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { 
  loadRecentActivity, 
  loadStreakPrizes, 
  // ❌ DEPRECATED: loadUserStreakData - no usado
  type StreakPrize
} from '@/store/slices/authSlice'
import type { RootState } from '@/store'

// 🔥 Hook que reemplaza useUserStreak de React Query
// ❌ DEPRECATED: useUserStreakRedux migrado a userData + hooks
export function useUserStreakRedux(userId: string) {
  console.log('🔍 useUserStreakRedux (DEPRECATED):', { 
    userId, 
    note: 'Usar useStreakCount(), useStreakData() de userData'
  })
  
  // ❌ NO hacer dispatch - los datos vienen de userData ahora
  // Los datos de racha se manejan via realtime en userData
  
  return {
    data: null, // ❌ DEPRECATED: usar useStreakData() hook
    isLoading: false,
    error: null
  }
}

// 🔥 Hook que reemplaza useStreakPrizes de React Query
export function useStreakPrizesRedux() {
  const dispatch = useAppDispatch()
  const { streakPrizes, streakPrizesLoaded, streakPrizesLastUpdate } = useSelector((state: RootState) => state.auth)
  
  // 🔄 Cargar premios con TTL para refresh automático
  useEffect(() => {
    const shouldRefresh = () => {
      // Si no están cargados, cargar siempre
      if (!streakPrizesLoaded) return true
      
      // Si no hay timestamp, refrescar
      if (!streakPrizesLastUpdate) return true
      
      // TTL: Si han pasado más de 2 minutos, refrescar
      const TTL_MINUTES = 2 * 60 * 1000 // 2 minutos
      const timeSinceUpdate = Date.now() - streakPrizesLastUpdate
      
      return timeSinceUpdate > TTL_MINUTES
    }
    
    if (shouldRefresh()) {
      console.log('🔄 Refrescando streakPrizes:', {
        loaded: streakPrizesLoaded,
        lastUpdate: streakPrizesLastUpdate ? new Date(streakPrizesLastUpdate).toLocaleString() : 'nunca',
        minutosDesdeUpdate: streakPrizesLastUpdate ? Math.round((Date.now() - streakPrizesLastUpdate) / 60000) : 'N/A'
      })
      dispatch(loadStreakPrizes())
    }
  }, [streakPrizesLoaded, streakPrizesLastUpdate, dispatch])
  
  return {
    data: streakPrizes,
    isLoading: !streakPrizesLoaded,
    error: null // TODO: Manejar errores si es necesario
  }
}

// 🔥 Hook que reemplaza useRecentActivity de React Query  
export function useRecentActivityRedux(userId: string) {
  const dispatch = useAppDispatch()
  const { recentActivity, recentActivityLoading, recentActivityError, recentActivityLoaded } = useSelector(
    (state: RootState) => ({
      recentActivity: state.auth.recentActivity,
      recentActivityLoading: state.auth.recentActivityLoading,
      recentActivityError: state.auth.recentActivityError,
      recentActivityLoaded: state.auth.recentActivityLoaded
    }),
    shallowEqual // 🎯 CLAVE: evitar re-renders innecesarios
  )
  
  // ✅ Migración completa - sin logs de debug para evitar ruido
  // console.log('🔍 useRecentActivityRedux:', { 
  //   userId, 
  //   recentActivityLoaded, 
  //   recentActivityLoading,
  //   dataCount: recentActivity.length,
  //   shouldLoad: userId && !recentActivityLoaded && !recentActivityLoading
  // })
  
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
  const streakData = useSelector((state: RootState) => state.userData?.streakData)
  const streakPrizes = useSelector((state: RootState) => state.auth.streakPrizes)
  const settings = useSelector((state: RootState) => state.settings.settings)
  
  // Usar datos de userData.streakData (migración completa)
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
