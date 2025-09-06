import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tipos básicos para el estado global
export interface BasicUserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string | null
}

export interface AppState {
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
  setCurrentView: (view: AppState['currentView']) => void
  setSettings: (settings: Record<string, string>) => void
  setOpenCheckin: (open: boolean) => void
  logout: () => void
  reset: () => void
  setLoading: (loading: boolean) => void
  setSettings: (settings: Record<string, string>) => void
  setOpenCheckin: (open: boolean) => void
  
  // Resetear estado
  reset: () => void
}

const initialState = {
  user: null,
  isAuthenticated: false,
  checkins: [],
  lastCheckin: null,
  currentView: 'home' as const,
  isLoading: false,
  openCheckin: false,
  settings: {},
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      addCheckin: (checkin) => set((state) => ({
        checkins: [checkin, ...state.checkins],
        lastCheckin: checkin,
        user: state.user ? {
          ...state.user,
          total_checkins: (state.user.total_checkins || 0) + 1,
          current_streak: checkin.streak_count
        } : null
      })),
      
      updateUserStats: (stats) => set((state) => ({
        user: state.user ? { ...state.user, ...stats } : null
      })),
      
      setCurrentView: (currentView) => set({ currentView }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setSettings: (settings) => set({ settings }),
      
      setOpenCheckin: (openCheckin) => set({ openCheckin }),
      
      reset: () => set(initialState)
    }),
    {
      name: 'fuego-rewards-app', // nombre del localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
        // No persistir UI state ni loading states
      }),
    }
  )
)

// Selectores optimizados para prevenir re-renders innecesarios
export const useUser = () => useAppStore((state) => state.user)
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated)
export const useCurrentView = () => useAppStore((state) => state.currentView)
export const useCheckins = () => useAppStore((state) => state.checkins)
export const useLastCheckin = () => useAppStore((state) => state.lastCheckin)
export const useAppSettings = () => useAppStore((state) => state.settings)
