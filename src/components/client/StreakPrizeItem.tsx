'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { CircularProgress } from '@/components/shared/CircularProgress'
import { useSettings } from '@/store/hooks'
import { CheckCircle, Gift } from 'lucide-react'

interface StreakReward {
  streak_days: number
  reward_type: string
  reward_value: string
  description?: string
  reward_image?: string
  is_completed?: boolean
}

interface StreakPrizeItemProps {
  prize: StreakReward
  currentProgress: number
  isCompleted: boolean
}

export function StreakPrizeItem({
  prize,
  currentProgress,
  isCompleted
}: StreakPrizeItemProps) {
  const settings = useSettings()
  
  const primaryColor = settings.company_theme_primary || '#D73527'
  
  // Memoized calculations
  const { progressColor, prizeTitle, prizeDescription } = useMemo(() => {
    const progressColor = isCompleted ? '#10B981' : primaryColor
    const prizeTitle = prize.reward_value || `Premio ${prize.streak_days} Días`
    const prizeDescription = prize.description || `Alcanza ${prize.streak_days} días de racha para desbloquear este premio`
    
    return { progressColor, prizeTitle, prizeDescription }
  }, [isCompleted, primaryColor, prize])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
      <div className="flex items-center justify-between">
        {/* Left side: Icon + Text */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Prize Icon - Más pequeño */}
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : prize.reward_image ? (
              <Image 
                src={prize.reward_image} 
                alt={prizeTitle}
                width={24}
                height={24}
                className="object-cover rounded-md"
              />
            ) : (
              <Gift className="w-5 h-5 text-gray-400" />
            )}
          </div>
          
          {/* Text Content - Más compacto */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {prizeTitle}
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {prizeDescription}
            </p>
          </div>
        </div>
        
        {/* Right side: Circular Progress - Más pequeño */}
        <div className="ml-3 flex-shrink-0">
          <CircularProgress
            progress={currentProgress}
            total={prize.streak_days}
            size={48}
            color={progressColor}
            strokeWidth={5}
            showNumbers={true}
          />
        </div>
      </div>
    </div>
  )
}