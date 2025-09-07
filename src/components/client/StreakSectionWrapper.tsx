import React from 'react'
import { StreakSection } from './StreakSection'
import { useUserStreak } from '@/hooks/queries/useStreakQueries'

interface StreakSectionWrapperProps {
  userId: string
}

export function StreakSectionWrapper({ userId }: StreakSectionWrapperProps) {
  const { data: streakData, isLoading } = useUserStreak(userId)

  // ✨ Solo un loading state, manejado por el componente hijo
  return <StreakSection 
    userId={userId} 
    currentCount={streakData?.currentCount || 0}
    isLoading={isLoading}
  />
}
