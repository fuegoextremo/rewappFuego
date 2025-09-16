'use client'

import { useEffect } from 'react'
import { useIsSpinning, useSpinStartTime, useLockDuration, useAppDispatch } from '@/store/hooks'
import { forceUnlock } from '@/store/slices/rouletteSlice'

/**
 * Hook de seguridad que fuerza el desbloqueo si han pasado demasiado tiempo
 * Previene bloqueos permanentes en caso de errores o bugs
 */
export function useSpinSafetyUnlock() {
  const isSpinning = useIsSpinning()
  const spinStartTime = useSpinStartTime()
  const lockDuration = useLockDuration()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isSpinning || !spinStartTime) return

    // Timer de seguridad: forzar desbloqueo después del doble del tiempo esperado
    const safetyDuration = lockDuration * 2 // 16 segundos vs 8 esperados
    const safetyTimer = setTimeout(() => {
      console.warn('🚨 SAFETY UNLOCK: Forzando desbloqueo por timeout de seguridad')
      dispatch(forceUnlock())
    }, safetyDuration)

    // Timer de verificación: cada 5 segundos verificar si debería estar desbloqueado
    const checkTimer = setInterval(() => {
      const timeElapsed = Date.now() - spinStartTime
      if (timeElapsed > lockDuration + 5000) { // 5 segundos de margen
        console.warn('🚨 SAFETY UNLOCK: Forzando desbloqueo por verificación periódica')
        dispatch(forceUnlock())
      }
    }, 5000)

    return () => {
      clearTimeout(safetyTimer)
      clearInterval(checkTimer)
    }
  }, [isSpinning, spinStartTime, lockDuration, dispatch])

  // Listener de visibilidad: desbloquear si el usuario vuelve después de mucho tiempo
  useEffect(() => {
    if (!isSpinning || !spinStartTime) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeElapsed = Date.now() - spinStartTime
        if (timeElapsed > lockDuration + 10000) { // 10 segundos de margen
          console.warn('🚨 SAFETY UNLOCK: Forzando desbloqueo por cambio de visibilidad')
          dispatch(forceUnlock())
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isSpinning, spinStartTime, lockDuration, dispatch])

  // Listener de focus: verificar cuando el usuario vuelve a la pestaña
  useEffect(() => {
    if (!isSpinning || !spinStartTime) return

    const handleFocus = () => {
      const timeElapsed = Date.now() - spinStartTime
      if (timeElapsed > lockDuration + 8000) { // 8 segundos de margen
        console.warn('🚨 SAFETY UNLOCK: Forzando desbloqueo por focus de ventana')
        dispatch(forceUnlock())
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isSpinning, spinStartTime, lockDuration, dispatch])
}