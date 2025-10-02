'use client'

import { useSelector, shallowEqual } from 'react-redux'
import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { 
  loadRecentActivity, 
  loadStreakPrizes, 
  // ❌ DEPRECATED: loadUserStreakData - no usado
  // ❌ ELIMINADO: type StreakPrize - movido a StreakSection.tsx
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

// ❌ ELIMINADO: useStreakStageRedux - lógica movida a StreakSection.tsx con detección de rachas rotas
