'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser } from '@/store/hooks'

interface ConfettiCelebrationProps {
  colors?: string[]
}

export function ConfettiCelebration({ 
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'] 
}: ConfettiCelebrationProps) {
  const user = useUser()
  const [showConfetti, setShowConfetti] = useState(false)
  const prevStreakPrizesCount = useRef(0)

  useEffect(() => {
    if (!user) return

    // Por ahora usando current_streak como trigger de prueba
    // Después cambiaremos a la propiedad correcta de premios completados
    const currentStreak = user.current_streak || 0
    
    // Si el streak aumentó (simulando completar un premio), ¡celebrar!
    if (currentStreak > prevStreakPrizesCount.current && prevStreakPrizesCount.current > 0) {
      console.log('🎊 ¡Streak aumentó! Disparando confeti de prueba...')
      setShowConfetti(true)
      
      // Ocultar confeti después de 3 segundos
      setTimeout(() => {
        setShowConfetti(false)
      }, 3000)
    }
    
    prevStreakPrizesCount.current = currentStreak
  }, [user?.current_streak, user])

  if (!showConfetti) return null

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Generar confeti */}
        {Array.from({ length: 100 }, (_, i) => {
          const color = colors[Math.floor(Math.random() * colors.length)]
          const leftPosition = Math.random() * 100
          const animationDelay = Math.random() * 3
          const animationDuration = Math.random() * 3 + 2
          const rotation = Math.random() * 360
          const size = Math.random() * 8 + 4
          
          return (
            <div
              key={i}
              className="confetti-piece"
              style={{
                '--color': color,
                '--left': `${leftPosition}%`,
                '--delay': `${animationDelay}s`,
                '--duration': `${animationDuration}s`,
                '--rotation': `${rotation}deg`,
                '--size': `${size}px`,
              } as React.CSSProperties}
            />
          )
        })}
      </div>

      <style jsx>{`
        .confetti-piece {
          position: absolute;
          top: -10px;
          left: var(--left);
          width: var(--size);
          height: var(--size);
          background: var(--color);
          animation: confetti-fall var(--duration) ease-in var(--delay) forwards;
          transform: rotate(var(--rotation));
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(var(--rotation)) scale(1);
            opacity: 1;
          }
          10% {
            transform: translateY(-90vh) rotate(calc(var(--rotation) + 180deg)) scale(1.1);
            opacity: 1;
          }
          20% {
            transform: translateY(-80vh) rotate(calc(var(--rotation) + 360deg)) scale(0.9);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(calc(var(--rotation) + 720deg)) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}