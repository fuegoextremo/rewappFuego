'use client'

import { useNavigationBlock } from '@/hooks/useNavigationBlock'
import { useSpinSafetyUnlock } from '@/hooks/useSpinSafetyUnlock'

/**
 * Componente que activa globalmente el bloqueo de navegación
 * Solo debe usarse una vez en el layout principal
 */
export function NavigationBlockProvider({ children }: { children: React.ReactNode }) {
  // 🔒 Activar el hook de bloqueo de navegación globalmente
  useNavigationBlock()
  
  // 🚨 Activar el hook de seguridad para auto-desbloqueo
  useSpinSafetyUnlock()

  return <>{children}</>
}