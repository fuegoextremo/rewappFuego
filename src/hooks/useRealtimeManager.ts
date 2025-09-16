'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useUser } from '@/store/hooks'
import { realtimeManager } from '@/lib/realtime/RealtimeManager'

// 🎯 Importar tipos del RealtimeManager
interface CheckinData {
  id: string
  user_id: string
  branch_id: string
  check_in_date: string
  spins_earned?: number
  created_at: string
}

interface CouponData {
  id: string
  user_id: string
  prize_id: string
  unique_code: string | null
  expires_at: string | null
  is_redeemed: boolean | null
  redeemed_at: string | null
  source: string | null
  created_at: string | null
}

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

  // 🚀 OPTIMIZACIÓN FASE 1.1: Eliminar polling innecesario de 2 segundos
  // La conexión es persistente y estable, no necesita verificación constante
  useEffect(() => {
    // Solo actualizar estado inicial y cuando cambie el userId
    setIsConnected(realtimeManager.isConnected())
  }, [userId])

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
export function useRealtimeCheckins(callback?: (data: { userId: string; checkinData: CheckinData }) => void) {
  useEffect(() => {
    if (callback) {
      realtimeManager.onCheckinUpdate(callback)
    }
  }, [callback])
}

/**
 * Hook específico para suscribirse a cambios de cupones
 */
export function useRealtimeCoupons(callback?: (data: { userId: string; couponData: CouponData }) => void) {
  useEffect(() => {
    if (callback) {
      realtimeManager.onCouponUpdate(callback)
    }
  }, [callback])
}
