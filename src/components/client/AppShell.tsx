'use client'

import { useEffect, Suspense, lazy } from 'react'
import { useAppStore, useUser, useCurrentView } from '@/stores/app-store'
import { useAppActions } from '@/hooks/use-app-actions'
import { BottomNav } from '@/components/client/BottomNav'
import CheckinSheet from '@/components/client/CheckinSheet'
import { UnauthorizedBanner } from '@/components/shared/UnauthorizedBanner'
import { AdminPreviewBanner } from '@/components/shared/AdminPreviewBanner'
import { createClientBrowser } from '@/lib/supabase/client'

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
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const user = useUser()
  const currentView = useCurrentView()
  const { openCheckin, setOpenCheckin } = useAppStore((state) => ({
    openCheckin: state.openCheckin,
    setOpenCheckin: state.setOpenCheckin
  }))
  const { initializeApp } = useAppActions()

  // Inicializar la app cuando el usuario esté disponible
  useEffect(() => {
    async function init() {
      const supabase = createClientBrowser()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        await initializeApp(authUser.id)
      }
    }
    
    init()
  }, [initializeApp])

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
        return children
    }
  }

  return (
    <div className="mx-auto max-w-sm min-h-dvh bg-white text-gray-900 flex flex-col">
      {/* Banners de estado */}
      <AdminPreviewBanner />
      
      {/* Header fijo */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold">Fuego Rewards</h1>
          <p className="text-xs text-gray-500">
            {user ? `¡Hola ${user.first_name}!` : '¡Registra tus visitas y participa!'}
          </p>
        </div>
      </header>

      {/* Contenido principal - con flex-1 para ocupar espacio disponible */}
      <main className="flex-1 pb-20 overflow-auto">
        <div className="px-4 pt-4">
          {/* Banner de error */}
          <UnauthorizedBanner />
          {renderCurrentView()}
        </div>
      </main>

      {/* Checkin Sheet */}
      <CheckinSheet 
        open={openCheckin} 
        onClose={() => setOpenCheckin(false)} 
      />

      {/* Bottom Navigation fijo */}
      <BottomNav onCheckinClick={() => setOpenCheckin(true)} />
    </div>
  )
}
