'use client'

import { useIsNavigationBlocked } from '@/store/hooks'
import { useToast } from '@/hooks/use-toast'
import { useRef } from 'react'
import type { AppDispatch } from '@/store'
import type { AnyAction } from '@reduxjs/toolkit'

/**
 * Hook para interceptar y bloquear navegación SPA durante el giro de la ruleta
 */
export function useBlockedDispatch() {
  const isBlocked = useIsNavigationBlocked()
  const { toast } = useToast()
  const toastShownRef = useRef(false)

  return (originalDispatch: AppDispatch) => {
    return (action: AnyAction) => {
      // Si está bloqueado y es una acción de navegación, interceptar
      if (isBlocked && action.type === 'ui/setCurrentView') {
        // Mostrar toast una vez por sesión de bloqueo
        if (!toastShownRef.current) {
          toast({
            title: '🎰 Navegación bloqueada',
            description: 'La ruleta está girando, espera a que termine...',
            variant: 'destructive',
            duration: 3000,
          })
          toastShownRef.current = true
        }
        
        // No ejecutar la acción de navegación
        console.warn('🚫 Navegación SPA bloqueada durante giro de ruleta:', action.payload)
        return
      }

      // Si no está bloqueado, reset del toast flag
      if (!isBlocked) {
        toastShownRef.current = false
      }

      // Ejecutar acción normalmente
      return originalDispatch(action)
    }
  }
}