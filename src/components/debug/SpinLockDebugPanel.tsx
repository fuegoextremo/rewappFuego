'use client'

import { useState, useEffect } from 'react'
import { useIsSpinning, useIsNavigationBlocked, useSpinStartTime, useLockDuration } from '@/store/hooks'

/**
 * Componente de debug para monitorear el estado del sistema de bloqueo
 * Solo visible en desarrollo
 */
export function SpinLockDebugPanel() {
  const isSpinning = useIsSpinning()
  const isNavigationBlocked = useIsNavigationBlocked()
  const spinStartTime = useSpinStartTime()
  const lockDuration = useLockDuration()
  
  // 🕐 Estado para forzar re-render cada segundo
  const [currentTime, setCurrentTime] = useState(Date.now())

  // 🔄 Actualizar tiempo cada 100ms cuando hay un spin activo
  useEffect(() => {
    if (!spinStartTime) {
      setCurrentTime(Date.now())
      return
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 100) // 100ms para actualización suave

    return () => clearInterval(interval)
  }, [spinStartTime])

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') return null

  const timeElapsed = spinStartTime ? currentTime - spinStartTime : 0
  const timeRemaining = spinStartTime ? Math.max(0, lockDuration - timeElapsed) : 0

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
      <div className="text-yellow-300 font-bold mb-2">🔒 Spin Lock Debug</div>
      <div className="space-y-1">
        <div>🎰 Spinning: <span className={isSpinning ? 'text-red-300' : 'text-green-300'}>{isSpinning ? 'YES' : 'NO'}</span></div>
        <div>🚫 Nav Blocked: <span className={isNavigationBlocked ? 'text-red-300' : 'text-green-300'}>{isNavigationBlocked ? 'YES' : 'NO'}</span></div>
        {spinStartTime && (
          <>
            <div>⏱️ Elapsed: {Math.round(timeElapsed / 1000)}s</div>
            <div>⏳ Remaining: {Math.round(timeRemaining / 1000)}s</div>
            <div>📏 Duration: {lockDuration / 1000}s</div>
          </>
        )}
      </div>
    </div>
  )
}