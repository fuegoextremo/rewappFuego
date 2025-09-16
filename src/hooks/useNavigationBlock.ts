'use client'

import { useEffect, useRef } from 'react'
import { useIsNavigationBlocked, useAppDispatch } from '@/store/hooks'
import { forceUnlock } from '@/store/slices/rouletteSlice'
import { useToast } from '@/hooks/use-toast'

/**
 * Hook personalizado para bloquear navegación durante el giro de la ruleta
 * Funciona tanto para navegación SPA como navegación tradicional del navegador
 */
export function useNavigationBlock() {
  const isBlocked = useIsNavigationBlocked()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const toastShownRef = useRef(false)

  useEffect(() => {
    if (!isBlocked) {
      toastShownRef.current = false
      return
    }

    // 🚫 Bloquear navegación del navegador (back/forward/refresh)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '🎰 ¡La ruleta está girando! ¿Estás seguro de que quieres salir?'
      return e.returnValue
    }

    // 🚫 Bloquear navegación con History API
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      
      // Mostrar toast de advertencia solo una vez
      if (!toastShownRef.current) {
        toast({
          title: '🎰 ¡Espera!',
          description: 'La ruleta está girando, por favor espera...',
          variant: 'destructive',
          duration: 2000,
        })
        toastShownRef.current = true
      }
      
      // Volver al estado actual
      window.history.pushState(null, '', window.location.href)
    }

    // Agregar listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    
    // Prevenir navegación hacia atrás agregando entrada al historial
    window.history.pushState(null, '', window.location.href)

    // 🔒 Auto-unlock de seguridad después de 10 segundos máximo
    const safetyTimeout = setTimeout(() => {
      console.warn('🚨 Auto-desbloqueando navegación por seguridad (timeout 10s)')
      dispatch(forceUnlock())
    }, 10000)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      clearTimeout(safetyTimeout)
    }
  }, [isBlocked, dispatch, toast])

  return {
    isNavigationBlocked: isBlocked,
    showBlockedMessage: () => {
      if (!toastShownRef.current) {
        toast({
          title: '🎰 Navegación bloqueada',
          description: 'La ruleta está girando, por favor espera...',
          variant: 'destructive',
          duration: 2000,
        })
        toastShownRef.current = true
      }
    }
  }
}