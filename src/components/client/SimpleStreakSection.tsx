'use client'

import { useSettings } from '@/store/hooks'

type Props = {
  currentCount: number
}

export function SimpleStreakSection({ currentCount }: Props) {
  const settings = useSettings()
  
  const primaryColor = settings.company_theme_primary || '#D73527'
  
  // Metas de racha simples
  const streakGoals = [3, 7, 15, 30]
  const nextGoal = streakGoals.find(goal => goal > currentCount) || streakGoals[streakGoals.length - 1]
  const progress = Math.min((currentCount / nextGoal) * 100, 100)

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Racha Actual</h3>
          <p className="text-sm text-gray-600">¡Mantén el ritmo!</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: primaryColor }}>
            {currentCount}
          </div>
          <div className="text-xs text-gray-500">días seguidos</div>
        </div>
      </div>
      
      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso hacia {nextGoal} días</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`
            }}
          />
        </div>
      </div>

      {/* Emojis de estado */}
      <div className="text-center">
        {currentCount === 0 && (
          <div className="text-gray-500">
            <div className="text-2xl mb-1">🔥</div>
            <p className="text-sm">¡Comienza tu racha hoy!</p>
          </div>
        )}
        {currentCount > 0 && currentCount < 7 && (
          <div className="text-orange-500">
            <div className="text-2xl mb-1">🚀</div>
            <p className="text-sm">¡Vas por buen camino!</p>
          </div>
        )}
        {currentCount >= 7 && (
          <div className="text-green-500">
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-sm">¡Eres un campeón!</p>
          </div>
        )}
      </div>
    </div>
  )
}
