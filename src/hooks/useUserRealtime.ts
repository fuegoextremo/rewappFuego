import { useEffect, useState } from 'react'
import { RealtimeManager } from '@/lib/realtime/RealtimeManager'

// 🚀 OPTIMIZACIÓN FASE 1.1: Hook simplificado SIN polling - solo retorna estado inicial
export function useUserRealtime() {
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    const manager = RealtimeManager.getInstance()
    setIsConnected(manager.isConnected())
    
    // ❌ ELIMINADO: Polling y eventos (causaban re-renders innecesarios)
    // El indicador "En vivo" es estático pero evita cascada de re-renders
    
  }, [])

  return { isConnected }
}

// 🎯 Hook para notificaciones globales
export function useRealtimeNotifications() {
  // Este hook puede expandirse para notificaciones admin-to-user en el futuro
  return { hasNotifications: false }
}
