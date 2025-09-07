import { useEffect } from 'react'
import { useUserRealtime as useRealtimeProvider } from '@/components/providers/RealtimeProvider'

// 🎯 Hook simplificado que usa el provider global
export function useUserRealtime(userId: string) {
  return useRealtimeProvider(userId)
}

// 🎯 Hook para notificaciones globales
export function useRealtimeNotifications() {
  // Este hook puede expandirse para notificaciones admin-to-user en el futuro
  return { hasNotifications: false }
}
