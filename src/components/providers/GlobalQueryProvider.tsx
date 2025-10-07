'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

interface GlobalQueryProviderProps {
  children: ReactNode
}

// Provider global de React Query para toda la app
export function GlobalQueryProvider({ children }: GlobalQueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 30, // 30 minutos (antes era cacheTime)
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
