'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuthStore } from '@/hooks/useAuthStore'

// 📋 CONTEXT TYPE
interface AuthContextType {
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

// 🏗️ CREAR CONTEXT
const AuthContext = createContext<AuthContextType | null>(null)

// 🎯 PROVIDER COMPONENT (SIMPLIFICADO)
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthStore()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

// 🎣 HOOK PARA USAR EL CONTEXT
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  
  return context
}

// 🎨 HOC PARA ENVOLVER COMPONENTES CON AUTENTICACIÓN
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthProvider>
        <Component {...props} />
      </AuthProvider>
    )
  }
}
