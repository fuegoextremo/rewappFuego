'use client'

import { ReactNode } from 'react'
import { RealtimeInitializer } from '@/components/providers/RealtimeInitializer'
import { ModalProvider } from '@/components/providers/ModalProvider'

interface ClientProvidersProps {
  children: ReactNode
}

// Providers específicos del cliente (NO incluye QueryClient, ya está en root)
export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <RealtimeInitializer>
      <ModalProvider>
        {children}
      </ModalProvider>
    </RealtimeInitializer>
  )
}
