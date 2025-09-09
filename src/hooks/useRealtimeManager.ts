'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useUser } from '@/store/hooks'
import { realtimeManager } from '@/lib/realtime/RealtimeManager'

/**
 * Hook que inicializa y maneja RealtimeManager en cualquier componente
 */
export function useRealtimeManager() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()
  const user = useUser()
  const userId = user?.id
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    // Configurar el manager con las dependencias
    realtimeManager.configure(queryClient, dispatch)

    if (userId) {
      // Conectar para el usuario actual
      realtimeManager.connect(userId)
    } else {
      // Desconectar si no hay usuario
      realtimeManager.disconnect()
    }

    // Actualizar estado de conexión
    setIsConnected(realtimeManager.isConnected())

    // Cleanup cuando el componente se desmonte
    return () => {
      // No desconectamos aquí porque queremos que persista
      // solo desconectamos cuando explícitamente no hay usuario
    }
  }, [userId, queryClient, dispatch])

  // Verificar estado de conexión periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const currentConnectionState = realtimeManager.isConnected()
      if (currentConnectionState !== isConnected) {
        setIsConnected(currentConnectionState)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isConnected])

  return {
    isConnected,
    currentUserId: realtimeManager.getCurrentUserId()
  }
}

/**
 * Hook específico para suscribirse a cambios de spins
 */
export function useRealtimeSpins(callback?: (data: { userId: string; availableSpins: number }) => void) {
  useEffect(() => {
    if (callback) {
      realtimeManager.onUserSpinsUpdate(callback)
    }
  }, [callback])
}

/**
 * Hook específico para suscribirse a check-ins
 */
export function useRealtimeCheckins(callback?: (data: { userId: string; checkinData: any }) => void) {
  useEffect(() => {
    if (callback) {
      realtimeManager.onCheckinUpdate(callback)
    }
  }, [callback])
}

/**
 * Hook específico para suscribirse a cambios de cupones
 */
export function useRealtimeCoupons(callback?: (data: { userId: string; couponData: any }) => void) {
  useEffect(() => {
    if (callback) {
      realtimeManager.onCouponUpdate(callback)
    }
  }, [callback])
}
