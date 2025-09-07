import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAppDispatch } from '@/store/hooks'
import { loadUserProfile } from '@/store/slices/authSlice'

export function useUserRealtime(userId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!userId) return

    const supabase = createClientBrowser()
    
    const channel = supabase
      .channel(`user-${userId}-realtime`)
      
      // 🎯 Escuchar nuevos check-ins
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('🎉 Nuevo check-in detectado:', payload)
        
        // Feedback visual inmediato
        toast({
          title: "¡Check-in exitoso! 🎉",
          description: `Has ganado ${payload.new.spins_earned || 1} giros para la ruleta`,
          duration: 4000,
        })
        
        // ✨ INVALIDAR QUERIES DE REACT QUERY
        queryClient.invalidateQueries({ queryKey: ['user', userId] })
        queryClient.invalidateQueries({ queryKey: ['user', 'profile', userId] })
        queryClient.invalidateQueries({ queryKey: ['user', 'stats', userId] })
        queryClient.invalidateQueries({ queryKey: ['user', 'checkins', userId] })
        
        // ✨ ACTUALIZAR REDUX STORE
        dispatch(loadUserProfile(userId))
        
        // ✨ DISPARAR EVENTO GLOBAL PARA COMPONENTES QUE NO USAN REACT QUERY
        window.dispatchEvent(new CustomEvent('user-data-updated', { detail: { userId } }))
      })
      
      // 🎯 Escuchar cambios en giros disponibles
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public', 
        table: 'user_spins',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('🎲 Giros actualizados:', payload)
        
        // ✨ INVALIDAR QUERIES Y ACTUALIZAR REDUX
        queryClient.invalidateQueries({ queryKey: ['user', userId, 'stats'] })
        queryClient.invalidateQueries({ queryKey: ['user', 'profile', userId] })
        dispatch(loadUserProfile(userId))
      })
      
      // 🎯 Escuchar cambios en rachas
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streaks', 
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('🔥 Racha actualizada:', payload)
        
        // ✨ INVALIDAR QUERIES Y ACTUALIZAR REDUX
        queryClient.invalidateQueries({ queryKey: ['user', userId, 'stats'] })
        queryClient.invalidateQueries({ queryKey: ['user', 'profile', userId] })
        dispatch(loadUserProfile(userId))
      })
      
      // 🎯 Monitorear estado de conexión
      .on('system', {}, (status) => {
        console.log('📡 Estado de conexión Realtime:', status)
        setIsConnected(status.status === 'SUBSCRIBED')
      })
      
      .subscribe((status) => {
        console.log('🔌 Suscripción Realtime:', status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    // Cleanup al desmontar
    return () => {
      console.log('🔌 Desconectando Realtime para usuario:', userId)
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [userId, queryClient, toast, dispatch])

  return { isConnected }
}

// 🎯 Hook para notificaciones globales
export function useRealtimeNotifications() {
  // Este hook puede expandirse para notificaciones admin-to-user en el futuro
  // Por ahora, solo retornamos un placeholder
  return { hasNotifications: false }
}
