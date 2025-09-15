'use client'

import { createContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAppDispatch, useUser } from '@/store/hooks'
import { loadUserProfile, updateAvailableSpins } from '@/store/slices/authSlice'
import { queryKeys } from '@/lib/queryClient' // 🚀 FASE 3.3: QueryKeys modernos
import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Tipo para el row de user_spins
type UserSpinsRow = Database['public']['Tables']['user_spins']['Row']

interface RealtimeContextType {
  isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

interface RealtimeProviderProps {
  children: ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const user = useUser()
  
  // 🎯 SOLUCIÓN: Extraer solo el userId como string estable
  const userId = user?.id
  
  // 🎯 Callbacks estables para evitar re-renders
  const stableToast = useCallback((params: Parameters<typeof toast>[0]) => toast(params), [toast])
  const stableDispatch = useCallback((action: ReturnType<typeof loadUserProfile> | ReturnType<typeof updateAvailableSpins>) => dispatch(action), [dispatch])
  
  // 🎯 Estado mínimo y limpio
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const connectedUserIdRef = useRef<string | null>(null)

  // ✨ SINGLE useEffect - simplificado al máximo
  useEffect(() => {
    console.log('� RealtimeProvider useEffect ejecutado para userId:', userId)
    
    // 🔒 Sin usuario - limpiar todo
    if (!userId) {
      if (channelRef.current) {
        const supabase = createClientBrowser()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        connectedUserIdRef.current = null
        setIsConnected(false)
      }
      return
    }

    // ✅ Ya conectado - IDEMPOTENCIA
    if (connectedUserIdRef.current === userId && channelRef.current) {
      console.log('✅ Realtime ya conectado para usuario:', userId)
      return
    }

    // 🔄 Cambio de usuario - limpiar anterior
    if (channelRef.current && connectedUserIdRef.current !== userId) {
      console.log('🔄 Cambiando usuario Realtime:', connectedUserIdRef.current, '→', userId)
      const supabase = createClientBrowser()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      connectedUserIdRef.current = null
      setIsConnected(false)
      
      // ✨ Esperar un momento antes de reconectar para evitar conflictos
      setTimeout(() => {
        // Re-ejecutar el efecto después del delay
        if (userId) {
          console.log('🔄 Reconectando después del delay...')
        }
      }, 1000)
      return
    }

    // 🚀 Nueva conexión optimizada
    console.log('🚀 Conectando Realtime para usuario:', userId)
    const supabase = createClientBrowser()
    
    const channel = supabase
      .channel(`user-realtime-${userId}`) // 🔧 VOLVEMOS al nombre dinámico, igual que en la pág de debug
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins'
      }, (payload) => {
        // ✨ Filtrar - solo eventos del usuario actual
        if (payload.new && payload.new.user_id === userId) {
          console.log('🎉 Check-in detectado:', payload)
          
          stableToast({
            title: "🎉 ¡Check-in realizado!",
            description: "Tu visita ha sido registrada correctamente",
            duration: 3000,
          })

          // 🚀 FASE 3.3: setQueryData optimizado en lugar de 8+ invalidaciones
          // Solo actualizar datos que NO vienen por Realtime para evitar redundancia
          
          // ✅ Check-ins history: Query (porque es lista histórica)
          queryClient.invalidateQueries({ queryKey: queryKeys.user.checkins(userId) })
          
          // ❌ ELIMINADO: invalidaciones redundantes para datos Realtime
          // ❌ ['user', 'streak', userId] → Viene por RealtimeManager
          // ❌ ['user', userId, 'stats'] → Viene por RealtimeManager  
          // ❌ ['user', 'spins', userId] → Viene por RealtimeManager
          // ❌ ['user', 'coupons', userId] → Viene por RealtimeManager
          // ❌ ['user', 'coupons', 'available', userId] → Viene por RealtimeManager
          
          console.log('🔴 RealtimeProvider: Check-in - solo invalidando datos estáticos')
          stableDispatch(loadUserProfile(userId))
          
          // ✨ Event para otros componentes
          window.dispatchEvent(new CustomEvent('user-data-updated', { 
            detail: { userId, type: 'check-in', data: payload } 
          }))
        }
      })
      // 🎟️ Cupones nuevos
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'coupons'
      }, (payload) => {
        // ✨ Filtrar - solo cupones del usuario actual
        if (payload.new && payload.new.user_id === userId) {
          console.log('🎟️ Nuevo cupón detectado:', payload)
          
          stableToast({
            title: "🎟️ ¡Nuevo cupón!",
            description: "Has ganado un nuevo cupón",
            duration: 4000,
          })

          // 🚀 FASE 3.3: RealtimeManager ya maneja cupones via postgres_changes
          // ❌ ELIMINADO: invalidaciones redundantes
          // ❌ ['user', 'coupons', userId] → Viene por RealtimeManager
          // ❌ ['user', 'coupons', 'available', userId] → Viene por RealtimeManager
          
          console.log('🔴 RealtimeProvider: Nuevo cupón - RealtimeManager se encarga de updates')
          
          // ✨ Event para otros componentes
          window.dispatchEvent(new CustomEvent('user-data-updated', { 
            detail: { userId, type: 'coupon', data: payload } 
          }))
        }
      })
      // 🎟️ Cupones redimidos
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'coupons'
      }, (payload) => {
        // ✨ Filtrar - solo cupones del usuario actual que fueron redimidos
        if (payload.new && payload.new.user_id === userId && payload.new.is_redeemed && !payload.old.is_redeemed) {
          console.log('✅ Cupón redimido:', payload)
          
          // 🚀 FASE 3.3: RealtimeManager ya maneja cupones via postgres_changes
          // ❌ ELIMINADO: invalidaciones redundantes
          // ❌ ['user', 'coupons', userId] → Viene por RealtimeManager
          // ❌ ['user', 'coupons', 'available', userId] → Viene por RealtimeManager
          // ❌ ['user', 'coupons', 'used', userId] → Viene por RealtimeManager
          
          console.log('🔴 RealtimeProvider: Cupón redimido - RealtimeManager se encarga de updates')
          
          // ✨ Event para otros componentes (como RedeemSheet)
          window.dispatchEvent(new CustomEvent('user-data-updated', { 
            detail: { userId, type: 'coupon', data: payload } 
          }))
        }
      })
      // 🎰 Cambios en giros de usuario (user_spins)
      .on('postgres_changes', {
        event: '*', // ✨ TODOS los eventos (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'user_spins'
      }, (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        console.log('🔔 CUALQUIER cambio en user_spins detectado:', payload)
        console.log('🔍 Payload completo:', JSON.stringify(payload, null, 2))
        
        // ✨ Type guard para verificar que payload.new tiene las propiedades necesarias
        const newRecord = payload.new as UserSpinsRow | null
        console.log('🔍 Payload.new.user_id:', newRecord?.user_id)
        console.log('🔍 UserId actual:', userId)
        
        // ✨ Filtrar - solo cambios del usuario actual
        if (newRecord && newRecord.user_id === userId && newRecord.available_spins !== null) {
          console.log('🎰 Cambio en giros detectado para nuestro usuario:', payload)
          
          const newAvailableSpins = newRecord.available_spins
          
          // 🎯 GRANULAR: Actualizar React Query directamente (para RouletteView)
          queryClient.setQueryData(['user', 'spins', userId], (oldData: { availableSpins: number } | undefined) => {
            if (oldData) {
              console.log('🎰 React Query: Actualizando spins de', oldData.availableSpins, 'a', newAvailableSpins)
              console.log('🎯 RouletteView será actualizado automáticamente')
              return { ...oldData, availableSpins: newAvailableSpins } // ✅ camelCase para coincidir con useUserSpins
            } else {
              console.warn('⚠️ oldData es undefined - RouletteView puede no tener datos base')
              return { availableSpins: newAvailableSpins } // ✅ camelCase
            }
          })
          
          // 🎯 GRANULAR: Actualizar Redux Store directamente (para HomeView)
          stableDispatch(updateAvailableSpins(newAvailableSpins))
          console.log('✅ Redux dispatch reactivado - ambos sistemas funcionando')
          
          // 🚀 FASE 3.3: RealtimeManager ya maneja user_stats via postgres_changes
          // ❌ ELIMINADO: invalidación redundante  
          // ❌ ['user', 'stats', userId] → Viene por RealtimeManager
          
          console.log('🔴 RealtimeProvider: Spins update - RealtimeManager se encarga de stats updates')
          
          // ✨ Event para otros componentes
          window.dispatchEvent(new CustomEvent('user-data-updated', { 
            detail: { userId, type: 'spins-updated', data: payload } 
          }))
        }
      })
      .subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => {
        console.log('🔌 Realtime status:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado exitosamente')
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error de canal Realtime')
          setIsConnected(false)
        } else if (status === 'CLOSED') {
          console.log('🔌 Canal Realtime cerrado')
          setIsConnected(false)
        }
      })

    // ✅ Guardar referencias
    channelRef.current = channel
    connectedUserIdRef.current = userId

    // 🧹 Cleanup function
    return () => {
      if (channelRef.current) {
        const supabase = createClientBrowser()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        connectedUserIdRef.current = null
        setIsConnected(false)
      }
    }
  }, [userId, queryClient, stableToast, stableDispatch]) // 🔧 Todas las dependencias incluidas

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export { RealtimeContext }
