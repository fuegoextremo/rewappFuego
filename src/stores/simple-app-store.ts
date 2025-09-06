import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tipos básicos para el estado global mínimo
export interface BasicUserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string | null
}

export interface SimpleAppState {
  // Auth (crítico)
  user: BasicUserProfile | null
  isAuthenticated: boolean
  
  // Navegación SPA
  currentView: 'home' | 'profile' | 'coupons' | 'roulette'
  
  // Configuraciones globales
  settings: Record<string, string>
  
  // UI básico
  openCheckin: boolean
  
  // Actions simples
  setUser: (user: BasicUserProfile | null) => void
  setCurrentView: (view: SimpleAppState['currentView']) => void
  setSettings: (settings: Record<string, string>) => void
  setOpenCheckin: (open: boolean) => void
  logout: () => void
  reset: () => void
}

// Estado inicial simple
const initialState: Omit<SimpleAppState, 'setUser' | 'setCurrentView' | 'setSettings' | 'setOpenCheckin' | 'logout' | 'reset'> = {
  user: null,
  isAuthenticated: false,
  currentView: 'home',
  settings: {},
  openCheckin: false,
}

export const useSimpleAppStore = create<SimpleAppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Actions simples
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setCurrentView: (currentView) => set({ currentView }),
      setSettings: (settings) => set({ settings }),
      setOpenCheckin: (openCheckin) => set({ openCheckin }),
      logout: () => set({ user: null, isAuthenticated: false }),
      reset: () => set(initialState)
    }),
    {
      name: 'fuego-rewards-simple-app',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
      }),
    }
  )
)

// Selectores simples
export const useUser = () => useSimpleAppStore((state) => state.user)
export const useIsAuthenticated = () => useSimpleAppStore((state) => state.isAuthenticated)
export const useCurrentView = () => useSimpleAppStore((state) => state.currentView)
export const useAppSettings = () => useSimpleAppStore((state) => state.settings)
