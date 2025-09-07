import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
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
  
  // 🎯 Estado mínimo y limpio
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)
  const connectedUserIdRef = useRef<string | null>(null)

  // ✨ SINGLE useEffect - limpio y optimizado
  useEffect(() => {
    const userId = user?.id

    // 🔒 Sin usuario - limpiar todo
    if (!userId) {
      if (channelRef.current) {
        console.log('� Usuario desconectado, limpiando Realtime')
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
      setIsConnected(false)
    }

    // 🚀 Nueva conexión optimizada
    console.log('🚀 Conectando Realtime para usuario:', userId)
    const supabase = createClientBrowser()
    
    const channel = supabase
      .channel('realtime:public:check_ins')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins'
      }, (payload) => {
        // ✨ Filtrar - solo eventos del usuario actual
        if (payload.new && payload.new.user_id === userId) {
          console.log('🎉 Check-in detectado:', payload)
          
          toast({
            title: "🎉 ¡Check-in realizado!",
            description: "Tu visita ha sido registrada correctamente",
            duration: 3000,
          })

          // ✨ Invalidar queries relevantes
          queryClient.invalidateQueries({ queryKey: ['user', 'streak', userId] })
          queryClient.invalidateQueries({ queryKey: ['streak', 'stage'] })
          queryClient.invalidateQueries({ queryKey: ['user', userId, 'stats'] })
          queryClient.invalidateQueries({ queryKey: ['user', 'profile', userId] })
          dispatch(loadUserProfile(userId))
          
          // ✨ Event para otros componentes
          window.dispatchEvent(new CustomEvent('user-data-updated', { 
            detail: { userId, type: 'check-in', data: payload } 
          }))
        }
      })
      .subscribe((status: any) => {
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
  }, [user?.id, dispatch, queryClient, toast]) // ✨ Dependencias estables

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export { RealtimeContext }
