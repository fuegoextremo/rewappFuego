import React from 'react'
import { StreakSection } from './StreakSection'
import { useUser } from '@/store/hooks'

export function StreakSectionWrapper() {
  const user = useUser()

  // ✨ Solo usar Redux como fuente única de verdad
  // El Realtime Manager ya actualiza Redux automáticamente
  return <StreakSection 
    currentCount={user?.current_streak || 0}
    isLoading={!user} // Loading si no hay datos de usuario
  />
}
