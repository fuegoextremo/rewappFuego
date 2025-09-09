import { useEffect, useState } from 'react'
import { RealtimeManager } from '@/lib/realtime/RealtimeManager'

// 🎯 Hook simplificado - solo retorna el estado de conexión del singleton
export function useUserRealtime() {
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    const manager = RealtimeManager.getInstance()
    setIsConnected(manager.isConnected())
    
    // Listener para cambios de estado de conexión
    const checkConnection = () => {
      setIsConnected(manager.isConnected())
    }
    
    // Verificar estado cada 5 segundos (opcional)
    const interval = setInterval(checkConnection, 5000)
    
    return () => clearInterval(interval)
  }, [])

  return { isConnected }
}

// 🎯 Hook para notificaciones globales
export function useRealtimeNotifications() {
  // Este hook puede expandirse para notificaciones admin-to-user en el futuro
  return { hasNotifications: false }
}
