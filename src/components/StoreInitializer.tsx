'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'

export function StoreInitializer() {
  useEffect(() => {
    // Hidratar el store manualmente al montar
    const hydrate = () => {
      try {
        const stored = localStorage.getItem('fuego-rewards-app')
        if (stored) {
          const parsedState = JSON.parse(stored)
          console.log('🔄 Hydrating store from localStorage:', parsedState)
          
          // Restaurar estado de manera segura
          if (parsedState.state) {
            const { user, isAuthenticated, currentView, settings } = parsedState.state
            
            useAppStore.setState({
              user: user || null,
              isAuthenticated: isAuthenticated || false,
              currentView: currentView || 'home',
              settings: settings || {},
            })
            
            console.log('✅ Store hydrated successfully')
          }
        } else {
          console.log('ℹ️ No stored state found')
        }
      } catch (error) {
        console.error('❌ Error hydrating store:', error)
      }
    }

    hydrate()
  }, [])

  return null
}
