import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAppDispatch, useUser } from '@/store/hooks'
import { loadUserProfile } from '@/store/slices/authSlice'

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
  const [isConnected, setIsConnected] = useState(false)
  const [currentChannel, setCurrentChannel] = useState<any>(null)
  const [connectedUserId, setConnectedUserId] = useState<string | null>(null)
  const [connectionTimeoutId, setConnectionTimeoutId] = useState<NodeJS.Timeout | null>(null)

  // ✨ CONECTAR AUTOMÁTICAMENTE cuando hay un usuario con debounce
  useEffect(() => {
    console.log('🔍 RealtimeProvider useEffect triggered:', {
      userId: user?.id,
      connectedUserId,
      hasChannel: !!currentChannel,
      userState: user ? 'loaded' : 'null'
    })

    // ✨ Limpiar timeout anterior si existe
    if (connectionTimeoutId) {
      clearTimeout(connectionTimeoutId)
    }

    if (user?.id && user.id !== connectedUserId) {
      console.log('🎯 Scheduling connection with debounce...')
      // ✨ Debounce de 100ms para evitar conexiones múltiples durante la carga
      const timeoutId = setTimeout(() => {
        console.log('🎯 Executing delayed connection for:', user.id)
        connectToUser(user.id)
      }, 100)
      
      setConnectionTimeoutId(timeoutId)
    } else if (!user?.id && currentChannel) {
      console.log('🔌 User logged out, disconnecting...')
      disconnectFromRealtime()
    } else {
      console.log('⏭️ Skipping connection:', {
        reason: user?.id === connectedUserId ? 'same user' : 'no user'
      })
    }

    return () => {
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId)
      }
    }
  }, [user?.id, connectedUserId])

  const connectToUser = useCallback((userId: string) => {
    // 🎯 Si ya estamos conectados al mismo usuario, no hacer nada
    if (connectedUserId === userId && currentChannel) {
      console.log('✅ Realtime ya conectado para usuario:', userId)
      return
    }

    // 🎯 Desconectar conexión anterior si existe
    if (currentChannel) {
      console.log('🔄 Cambiando conexión Realtime de', connectedUserId, 'a', userId)
      const supabase = createClientBrowser()
      supabase.removeChannel(currentChannel)
      setCurrentChannel(null)
      setConnectedUserId(null)
      setIsConnected(false)
    }

    console.log('🚀 Conectando Realtime para usuario:', userId)
    const supabase = createClientBrowser()
    
    // ✨ CONFIGURACIÓN SIMPLE PARA DIAGNÓSTICO
    const channel = supabase
      .channel(`user-${userId}-realtime`)
      
      // 🎯 Solo escuchar check-ins por ahora (configuración mínima)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins'
      }, (payload) => {
        console.log('📨 Evento Realtime recibido:', payload)
        
        // ✨ Filtrar en el cliente por seguridad
        if (payload.new && payload.new.user_id === userId) {
          console.log('🎉 Nuevo check-in detectado para usuario actual:', payload)
          
          toast({
            title: "🎉 ¡Check-in realizado!",
            description: "Tu visita ha sido registrada correctamente",
            duration: 3000,
          })

          // ✨ INVALIDAR QUERIES RELEVANTES
          queryClient.invalidateQueries({ queryKey: ['user', 'streak', userId] })
          queryClient.invalidateQueries({ queryKey: ['streak', 'stage'] })
          queryClient.invalidateQueries({ queryKey: ['user', userId, 'stats'] })
          queryClient.invalidateQueries({ queryKey: ['user', 'profile', userId] })
          
          // ✨ ACTUALIZAR REDUX
          dispatch(loadUserProfile(userId))
          
          // ✨ CUSTOM EVENT para componentes
          window.dispatchEvent(new CustomEvent('user-data-updated', { 
            detail: { userId, type: 'check-in', data: payload } 
          }))
        } else {
          console.log('🔇 Check-in ignorado (no es del usuario actual)')
        }
      })
      
      // 🎯 Monitorear estado de conexión
      .on('system', {}, (status: any) => {
        console.log('📡 Estado de conexión Realtime:', status)
        setIsConnected(status.status === 'ok')
      })
      
      .subscribe((status: any, err?: any) => {
        console.log('🔌 Suscripción Realtime:', status)
        
        if (err) {
          console.error('❌ Error en suscripción:', err)
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime conectado exitosamente para:', userId)
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error de canal Realtime - Posibles causas:')
          console.error('   🔐 RLS policies bloqueando la suscripción')
          console.error('   📊 Tabla no habilitada para Realtime')
          console.error('   🔑 Permisos insuficientes')
          console.error('🔍 Detalles:', {
            channel: `user-${userId}-realtime`,
            userId,
            timestamp: new Date().toISOString()
          })
          setIsConnected(false)
        } else if (status === 'CLOSED') {
          console.log('🔌 Canal cerrado para usuario:', userId)
          setIsConnected(false)
        }
      })

    setCurrentChannel(channel)
    setConnectedUserId(userId)
  }, [connectedUserId, currentChannel, queryClient, toast, dispatch])

  const disconnectFromRealtime = useCallback(() => {
    if (currentChannel) {
      console.log('🔌 Desconectando Realtime para usuario:', connectedUserId)
      const supabase = createClientBrowser()
      supabase.removeChannel(currentChannel)
      setCurrentChannel(null)
      setConnectedUserId(null)
      setIsConnected(false)
    }
  }, [currentChannel, connectedUserId])

  // 🎯 Cleanup global al desmontar el provider
  useEffect(() => {
    return () => {
      disconnectFromRealtime()
    }
  }, [disconnectFromRealtime])

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export { RealtimeContext }
