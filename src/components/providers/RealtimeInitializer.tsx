'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useRealtimeManager } from '@/hooks/useRealtimeManager'
import { useUser, useAppDispatch } from '@/store/hooks'
import { loadUserProfile } from '@/store/slices/authSlice'
import { loadUserStats, loadStreakData } from '@/store/slices/userDataSlice'

interface RealtimeInitializerProps {
  children: ReactNode
}

/**
 * Componente que inicializa RealtimeManager + Sincronización Híbrida Inteligente
 */
export function RealtimeInitializer({ children }: RealtimeInitializerProps) {
  // Este hook se encarga de toda la lógica de inicialización de realtime
  useRealtimeManager()
  
  // 🎯 SINCRONIZACIÓN HÍBRIDA: Hooks para detectar datos incompletos
  const user = useUser()
  const dispatch = useAppDispatch()
  
  // 🎯 Trackear si ya ejecutamos sincronización inicial en esta sesión
  const hasSyncedOnce = useRef(false)
  
  // 🔄 SINCRONIZACIÓN INICIAL INTELIGENTE
  useEffect(() => {
    // Solo ejecutar si hay usuario autenticado
    if (!user?.id) return
    
    // Verificar si faltan datos críticos (solo datos estáticos en authSlice)
    const missingCriticalData = user.total_checkins === undefined
    
    // 🚀 NUEVA LÓGICA: Forzar sincronización en primer mount O si faltan datos
    const shouldSync = missingCriticalData || !hasSyncedOnce.current

    if (shouldSync) {
      const reason = missingCriticalData ? 'datos_incompletos' : 'primer_mount_garantizar_datos_frescos'
      
      console.log(`🔄 Sincronización inicial: ${reason}`, {
        userId: user.id,
        total_checkins: user.total_checkins,
        hasSyncedBefore: hasSyncedOnce.current
      })
      
      // Forzar carga de datos frescos
      Promise.all([
        dispatch(loadUserProfile(user.id)),     // authSlice: datos estáticos
        dispatch(loadUserStats(user.id)),       // userData: userStats
        dispatch(loadStreakData(user.id))       // userData: streakData
      ])
        .then(() => {
          console.log('✅ Sincronización inicial completada: authSlice + userData cargados')
          hasSyncedOnce.current = true
        })
        .catch((error) => {
          console.error('❌ Error en sincronización inicial:', error)
        })
    } else {
      console.log('✅ Sincronización inicial ya ejecutada en esta sesión', {
        total_checkins: user.total_checkins
      })
    }
  }, [user?.id, user?.total_checkins, dispatch])

  // No necesita envolver children en ningún Context, solo inicializa
  return <>{children}</>
}
