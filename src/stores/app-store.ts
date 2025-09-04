import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Tipos para el estado global
export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: string | null
  is_active: boolean | null
  branch_id: string | null
  created_at: string | null
  total_checkins?: number
  available_spins?: number
  current_streak?: number
}

export interface CheckinData {
  id: string
  user_id: string | null
  branch_id: string | null
  created_at: string | null
  streak_count: number
}

export interface AppState {
  // Usuario actual
  user: UserProfile | null
  isAuthenticated: boolean
  
  // Datos de la aplicación
  checkins: CheckinData[]
  lastCheckin: CheckinData | null
  
  // UI Estado
  currentView: 'home' | 'profile' | 'coupons' | 'roulette'
  isLoading: boolean
  openCheckin: boolean
  
  // Configuraciones
  settings: Record<string, string>
  
  // Actions
  setUser: (user: UserProfile | null) => void
  setAuthenticated: (isAuth: boolean) => void
  addCheckin: (checkin: CheckinData) => void
  updateUserStats: (stats: Partial<UserProfile>) => void
  setCurrentView: (view: AppState['currentView']) => void
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
