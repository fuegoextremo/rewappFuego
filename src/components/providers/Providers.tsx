'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as ReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store'
import { queryClient } from '@/lib/queryClient'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

// 🎯 PROVIDER COMBINADO: Redux + React Query
export function Providers({ children }: ProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<AppLoading />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          {children}
          {/* React Query DevTools solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </PersistGate>
    </ReduxProvider>
  )
}

// 🔄 COMPONENTE DE LOADING MIENTRAS SE HIDRATA REDUX
function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-3 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 text-lg font-medium">Cargando REWAPP...</p>
        <p className="text-gray-400 text-sm">Inicializando sistema</p>
      </div>
    </div>
  )
}
