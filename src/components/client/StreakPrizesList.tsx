'use client'

import { useMemo } from 'react'
import { useUser, useSettings, useSetting } from '@/store/hooks'
import { StreakPrizeItem } from './StreakPrizeItem'
import { useStreakPrizesRedux } from '@/hooks/useReduxStreaks'

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
  const settings = useSettings()
  const { data: realStreakPrizes, isLoading } = useStreakPrizesRedux()
  
  // Check if component should be visible
  const showComponent = useSetting('show_streak_prizes_list') || process.env.NEXT_PUBLIC_SHOW_STREAK_PRIZES === 'true'
  
  const currentStreak = user?.current_streak || 0
  const lastCheckinDate = user?.streakData?.last_check_in
  const streakExpiryDays = settings.streak_expiry_days || 12
  
  // Calculate days until streak breaks
  const daysUntilStreakBreaks = useMemo(() => {
    if (!lastCheckinDate || currentStreak === 0) return null
    
    const lastCheckin = new Date(lastCheckinDate)
    const today = new Date()
    const daysSinceLastCheckin = Math.floor((today.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24))
    const daysUntilBreak = Number(streakExpiryDays) - daysSinceLastCheckin
    
    return Math.max(0, daysUntilBreak)
  }, [lastCheckinDate, currentStreak, streakExpiryDays])
  
  // Process real streak rewards from database or fallback to static ones
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
    } else {
      // Fallback to static configuration with Spanish text
      return [
        {
          streak_days: 5,
          reward_type: 'discount',
          reward_value: 'Premio 5 Visitas',
          description: 'Regalo especial por 5 visitas consecutivas',
          is_completed: currentStreak >= 5
        },
        {
          streak_days: 10,
          reward_type: 'free_item',
          reward_value: 'Premio 10 Visitas',
          description: 'Regalo especial por 10 visitas consecutivas', 
          is_completed: currentStreak >= 10
        },
        {
          streak_days: 15,
          reward_type: 'special_menu',
          reward_value: 'Premio 15 Visitas',
          description: 'Regalo especial por 15 visitas consecutivas',
          is_completed: currentStreak >= 15
        },
        {
          streak_days: 20,
          reward_type: 'premium_discount',
          reward_value: 'Premio Racha Completa',
          description: 'Premio especial por completar 20 visitas',
          is_completed: currentStreak >= 20
        }
      ]
    }
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
  
  // Show streak warning if applicable
  const showStreakWarning = daysUntilStreakBreaks !== null && 
                           daysUntilStreakBreaks <= 3 && 
                           currentStreak > 0
  
  // Don't render if disabled, no items, or still loading
  if (!showComponent || displayedRewards.length === 0 || isLoading) {
    return null
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Título de la sección */}
      <div className="px-2">
        <h3 className="text-lg font-bold text-gray-900 mb-1">🏆 Premios por Racha</h3>
        <p className="text-sm text-gray-600">Mantén tu racha para desbloquear premios increíbles</p>
      </div>
      
      {displayedRewards.map((reward) => (
        <StreakPrizeItem
          key={reward.streak_days}
          prize={reward}
          currentProgress={Math.min(currentStreak, reward.streak_days)}
          isCompleted={reward.is_completed}
          daysUntilStreakBreaks={daysUntilStreakBreaks ?? undefined}
          showStreakWarning={showStreakWarning}
        />
      ))}
    </div>
  )
}