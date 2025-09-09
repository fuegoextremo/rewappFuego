'use client'

import { ReactNode } from 'react'
import { useRealtimeManager } from '@/hooks/useRealtimeManager'

interface RealtimeInitializerProps {
  children: ReactNode
}

/**
 * Componente simple que inicializa RealtimeManager sin ser un Provider pesado
 */
export function RealtimeInitializer({ children }: RealtimeInitializerProps) {
  // Este hook se encarga de toda la lógica de inicialización
  useRealtimeManager()

  // No necesita envolver children en ningún Context, solo inicializa
  return <>{children}</>
}
