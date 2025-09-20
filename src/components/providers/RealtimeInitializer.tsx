'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useRealtimeManager } from '@/hooks/useRealtimeManager'
import { useUser, useAppDispatch } from '@/store/hooks'
import { loadUserProfile } from '@/store/slices/authSlice'

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
    
    // Verificar si faltan datos críticos
    const missingCriticalData = user.current_streak === undefined || 
                               user.available_spins === undefined ||
                               user.total_checkins === undefined
    
    // 🚀 NUEVA LÓGICA: Forzar sincronización en primer mount O si faltan datos
    // Esto resuelve el caso de datos "completos" pero obsoletos en Redux
    const shouldSync = missingCriticalData || !hasSyncedOnce.current

    if (shouldSync) {
      const reason = missingCriticalData ? 'datos_incompletos' : 'primer_mount_garantizar_datos_frescos'
      
      console.log(`🔄 Sincronización inicial: ${reason}`, {
        userId: user.id,
        current_streak: user.current_streak,
        available_spins: user.available_spins,
        total_checkins: user.total_checkins,
        hasSyncedBefore: hasSyncedOnce.current
      })
      
      // Forzar carga de datos frescos
      dispatch(loadUserProfile(user.id))
        .then(() => {
          console.log('✅ Sincronización inicial completada: datos frescos cargados')
          hasSyncedOnce.current = true
        })
        .catch((error) => {
          console.error('❌ Error en sincronización inicial:', error)
        })
    } else {
      console.log('✅ Sincronización inicial ya ejecutada en esta sesión', {
        current_streak: user.current_streak,
        available_spins: user.available_spins,
        total_checkins: user.total_checkins
      })
    }
  }, [user?.id, user?.current_streak, user?.available_spins, user?.total_checkins, dispatch])

  // No necesita envolver children en ningún Context, solo inicializa
  return <>{children}</>
}
