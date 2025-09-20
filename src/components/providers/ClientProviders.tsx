'use client'

import { ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RealtimeInitializer } from '@/components/providers/RealtimeInitializer'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())
  
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeInitializer>
        {children}
      </RealtimeInitializer>
    </QueryClientProvider>
  )
}
