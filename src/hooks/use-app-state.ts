'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AppView = 'home' | 'roulette' | 'coupons' | 'profile'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  checkinCount: number
  availableSpins: number
  lastCheckin?: string
}

interface AppState {
  // Navigation
  currentView: AppView
  setCurrentView: (view: AppView) => void
  
  // User data cache
  userData: UserData | null
  setUserData: (data: UserData) => void
  
  // Real-time updates
  updateCheckinCount: (count: number) => void
  updateSpins: (spins: number) => void
  
  // Loading states
  isLoadingUserData: boolean
  setIsLoadingUserData: (loading: boolean) => void
  
  // Cache timestamps for invalidation
  lastDataFetch: number
  updateLastDataFetch: () => void
  
  // Optimistic updates
  optimisticCheckin: () => void
  optimisticSpinUse: () => void
}

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),
      
      // User data
      userData: null,
      setUserData: (data) => set({ userData: data }),
      
      // Real-time updates
      updateCheckinCount: (count) => set((state) => ({
        userData: state.userData ? { ...state.userData, checkinCount: count } : null
      })),
      
      updateSpins: (spins) => set((state) => ({
        userData: state.userData ? { ...state.userData, availableSpins: spins } : null
      })),
      
      // Loading states
      isLoadingUserData: false,
      setIsLoadingUserData: (loading) => set({ isLoadingUserData: loading }),
      
      // Cache management
      lastDataFetch: 0,
      updateLastDataFetch: () => set({ lastDataFetch: Date.now() }),
      
      // Optimistic updates
      optimisticCheckin: () => set((state) => ({
        userData: state.userData ? {
          ...state.userData,
          checkinCount: state.userData.checkinCount + 1,
          availableSpins: state.userData.availableSpins + 1,
          lastCheckin: new Date().toISOString()
        } : null
      })),
      
      optimisticSpinUse: () => set((state) => ({
        userData: state.userData ? {
          ...state.userData,
          availableSpins: Math.max(0, state.userData.availableSpins - 1)
        } : null
      }))
    }),
    {
      name: 'app-state',
      storage: createJSONStorage(() => sessionStorage), // Persist during session
      partialize: (state) => ({
        userData: state.userData,
        lastDataFetch: state.lastDataFetch,
        currentView: state.currentView
      })
    }
  )
)
