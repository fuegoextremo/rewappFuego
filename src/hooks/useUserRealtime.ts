import { useContext } from 'react'
import { RealtimeContext } from '@/components/providers/RealtimeProvider'

// 🎯 Hook simplificado - solo retorna el estado de conexión
export function useUserRealtime() {
  const context = useContext(RealtimeContext)
  
  if (!context) {
    throw new Error('useUserRealtime debe usarse dentro de RealtimeProvider')
  }

  return context
}

// 🎯 Hook para notificaciones globales
export function useRealtimeNotifications() {
  // Este hook puede expandirse para notificaciones admin-to-user en el futuro
  return { hasNotifications: false }
}
