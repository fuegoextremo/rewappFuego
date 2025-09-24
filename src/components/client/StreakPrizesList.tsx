'use client'

import { useMemo } from 'react'
import { useUser, useSetting } from '@/store/hooks'
import { StreakPrizeItem } from './StreakPrizeItem'
import { useStreakPrizesRedux } from '@/hooks/useReduxStreaks'
import { Trophy } from "lucide-react";
import { useSystemSettings } from "@/hooks/use-system-settings";



interface StreakPrizesListProps {
  showCompleted?: boolean
  maxItems?: number
  className?: string
}

export function StreakPrizesList({ 
  showCompleted = true, 
  maxItems,
  className = '' 
}: StreakPrizesListProps) {
  const user = useUser()
  const { data: realStreakPrizes, isLoading } = useStreakPrizesRedux()
  
  // Check if component should be visible
  const showComponent = useSetting('show_streak_prizes_list') || process.env.NEXT_PUBLIC_SHOW_STREAK_PRIZES === 'true'
  
  const currentStreak = user?.current_streak || 0

  const { data: settings } = useSystemSettings();
const primaryColor = settings?.company_theme_primary || "#D73527";

  
  // Process real streak rewards from database
  const streakRewards = useMemo(() => {
    if (realStreakPrizes && realStreakPrizes.length > 0) {
      // Use real prizes from database
      return realStreakPrizes
        .filter(prize => prize.streak_threshold && prize.streak_threshold > 0)
        .sort((a, b) => (a.streak_threshold || 0) - (b.streak_threshold || 0))
        .map(prize => ({
          streak_days: prize.streak_threshold || 0,
          reward_type: 'database_prize',
          reward_value: prize.name || 'Premio especial',
          description: prize.description || '',
          is_completed: currentStreak >= (prize.streak_threshold || 0)
        }))
    }
    
    // No fallback - component will hide if no prizes configured
    return []
  }, [realStreakPrizes, currentStreak])
  
  // Filter and limit items
  const displayedRewards = useMemo(() => {
    let filtered = streakRewards
    
    // Filter completed items if not showing them
    if (!showCompleted) {
      filtered = filtered.filter(reward => !reward.is_completed)
    }
    
    // Limit items if specified
    if (maxItems) {
      filtered = filtered.slice(0, maxItems)
    }
    
    return filtered
  }, [streakRewards, showCompleted, maxItems])
  
  // Don't render if disabled, no items, or still loading
  if (!showComponent || displayedRewards.length === 0 || isLoading) {
    return null
  }
  
  return (
    <div className={`space-y-3  ${className}`}>
      {/* Título de la sección */}
      <div className="p-2">
        <div className='flex gap-2 align-text-bottom'><Trophy size={26} style={{ color: primaryColor }} />
        <h3 className="text-lg font-bold text-gray-900 ">Premios por Racha</h3></div>
        <p className="text-sm text-gray-600">Mantén tu racha para desbloquear premios increíbles</p>
      </div>
      
      {displayedRewards.map((reward) => (
        <StreakPrizeItem
          key={reward.streak_days}
          prize={reward}
          currentProgress={Math.min(currentStreak, reward.streak_days)}
          isCompleted={reward.is_completed}
        />
      ))}
    </div>
  )
}