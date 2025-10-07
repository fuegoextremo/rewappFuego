'use client'

import { useCurrentStreak } from '@/store/hooks'

// 🧪 Test component para debuggear re-renders
export function SimpleStreakTest() {
  const currentStreak = useCurrentStreak()
  
  // Log removido para reducir noise en consola
  // console.log('🧪 SimpleStreakTest render:', { currentStreak, timestamp: Date.now() })
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'red', 
      color: 'white', 
      padding: '5px',
      fontSize: '12px',
      zIndex: 9999 
    }}>
      Test: {currentStreak}
    </div>
  )
}