'use client'

import { Suspense, lazy, useState, useCallback } from 'react'
import { useAuthManager } from '@/hooks/useAuthManager'
import { useUser, useCurrentView, useOpenCheckin, useAppDispatch } from '@/store/hooks'
import { setOpenCheckin, setRefreshing } from '@/store/slices/uiSlice'
import { BottomNav } from '@/components/client/BottomNav'
import CheckinSheet from '@/components/client/CheckinSheet'

// Componentes de las vistas principales con lazy loading
const HomeView = lazy(() => import('@/components/client/views/HomeView'))
const ProfileView = lazy(() => import('@/components/client/views/ProfileView'))
const CouponsView = lazy(() => import('@/components/client/views/CouponsView'))
const RouletteView = lazy(() => import('@/components/client/views/RouletteView'))

// Loading component
const ViewLoading = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-500 text-sm">Cargando...</p>
    </div>
  </div>
)

interface AppShellProps {
  children?: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  // 🔗 REDUX HOOKS
  const dispatch = useAppDispatch()
  const user = useUser()
  const currentView = useCurrentView()
  const openCheckin = useOpenCheckin()
  
  // 🔐 AUTH MANAGER
  const { isLoading, isAuthenticated } = useAuthManager()
  
  // 🎨 LOCAL STATE
  const [isRefreshing, setIsRefreshingLocal] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  // 🔄 Pull-to-refresh logic
  const handleRefresh = useCallback(async () => {
    if (!user?.id || isRefreshing) return
    
    setIsRefreshingLocal(true)
    dispatch(setRefreshing(true))
    
    try {
      console.log('🔄 Iniciando pull-to-refresh...')
      
      // Disparar evento para que todos los componentes se refresquen
      window.dispatchEvent(new CustomEvent('app-refresh'))
      
      // Esperar un momento para que los componentes procesen
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Pull-to-refresh completado')
    } catch (error) {
      console.error('❌ Error en pull-to-refresh:', error)
    } finally {
      setIsRefreshingLocal(false)
      dispatch(setRefreshing(false))
      setPullDistance(0)
    }
  }, [user?.id, isRefreshing, dispatch])

  // Touch handlers for pull-to-refresh
  const handleTouchStart = useCallback(() => {
    if (window.scrollY > 0) return
    setPullDistance(0)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return
    
    const touch = e.touches[0]
    const startY = touch.clientY
    
    if (startY > 100) { // Only trigger if pulling from top area
      const distance = Math.max(0, Math.min(startY - 100, 120))
      setPullDistance(distance)
    }
  }, [isRefreshing])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 60 && !isRefreshing) {
      handleRefresh()
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, isRefreshing, handleRefresh])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-sm">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Renderizar vista según estado actual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <Suspense fallback={<ViewLoading />}>
            <HomeView />
          </Suspense>
        )
      case 'profile':
        return (
          <Suspense fallback={<ViewLoading />}>
            <ProfileView />
          </Suspense>
        )
      case 'coupons':
        return (
          <Suspense fallback={<ViewLoading />}>
            <CouponsView />
          </Suspense>
        )
      case 'roulette':
        return (
          <Suspense fallback={<ViewLoading />}>
            <RouletteView />
          </Suspense>
        )
      default:
        return children || (
          <Suspense fallback={<ViewLoading />}>
            <HomeView />
          </Suspense>
        )
    }
  }

  return (
    <div className="min-h-dvh bg-white text-gray-900 flex flex-col">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center bg-blue-50 transition-all duration-200"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullDistance / 80 
          }}
        >
          <div className="text-center">
            {pullDistance > 60 ? (
              <>
                <div className="text-xl mb-1">🔄</div>
                <p className="text-xs text-blue-600">Suelta para actualizar</p>
              </>
            ) : (
              <>
                <div className="text-lg mb-1">⬇️</div>
                <p className="text-xs text-gray-500">Tira hacia abajo</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contenido principal - con flex-1 para ocupar espacio disponible */}
      <main 
        className="flex-1 pb-20 overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 pt-4">
          {/* Loading indicator during refresh */}
          {isRefreshing && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-blue-600">Actualizando...</span>
            </div>
          )}
          
          {renderCurrentView()}
        </div>
      </main>

      {/* Checkin Sheet */}
      <CheckinSheet 
        open={openCheckin} 
        onClose={() => dispatch(setOpenCheckin(false))} 
      />

      {/* Bottom Navigation fijo */}
      <BottomNav onCheckinClick={() => dispatch(setOpenCheckin(true))} />
    </div>
  )
}
