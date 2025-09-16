'use client'

import Link from 'next/link'
import { useIsNavigationBlocked } from '@/store/hooks'
import { useToast } from '@/hooks/use-toast'
import { useRef, ReactNode, MouseEvent } from 'react'

interface BlockedLinkProps {
  href: string
  children: ReactNode
  className?: string
}

/**
 * Wrapper de Link que respeta el bloqueo de navegación de la ruleta
 */
export function BlockedLink({ href, children, className }: BlockedLinkProps) {
  const isBlocked = useIsNavigationBlocked()
  const { toast } = useToast()
  const toastShownRef = useRef(false)

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isBlocked) {
      e.preventDefault()
      
      // Mostrar toast solo una vez por sesión de bloqueo
      if (!toastShownRef.current) {
        toast({
          title: '🎰 Navegación bloqueada',
          description: 'La ruleta está girando, espera a que termine...',
          variant: 'destructive',
          duration: 3000,
        })
        toastShownRef.current = true
      }
      
      console.warn('🚫 Navegación SSR bloqueada durante giro de ruleta:', href)
      return false
    }

    // Si no está bloqueado, reset del toast flag
    toastShownRef.current = false
  }

  return (
    <Link 
      href={href} 
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  )
}