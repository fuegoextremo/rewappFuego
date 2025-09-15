import React, { memo } from 'react'
import { StreakSection } from './StreakSection'
import { useUser } from '@/store/hooks'

// 🎯 Componente optimizado para evitar re-renders innecesarios
function StreakSectionWrapperComponent() {
  const user = useUser()

  // ✨ Solo usar Redux como fuente única de verdad
  // El Realtime Manager ya actualiza Redux automáticamente
  return <StreakSection 
    currentCount={user?.current_streak || 0}
    isLoading={!user} // Loading si no hay datos de usuario
  />
}

// 🎯 OPTIMIZACIÓN: Memo para evitar re-renders cuando user no cambia realmente
export const StreakSectionWrapper = memo(StreakSectionWrapperComponent)
