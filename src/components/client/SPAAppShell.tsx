'use client'

import { Suspense, lazy, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, useCurrentView, useOpenCheckin, useAppDispatch, useAuthLoading } from '@/store/hooks'
import { setOpenCheckin } from '@/store/slices/uiSlice'
import { ClientGuard } from '@/components/auth/RoleGuards'
import { BottomNav } from '@/components/client/BottomNav'
import CheckinSheet from '@/components/client/CheckinSheet'
import { VersionToggle } from '@/components/shared/VersionToggle'

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

// 🎯 COMPONENTE INTERNO SPA (OPTIMIZADO SEGÚN DOCUMENTACIÓN)
function SPAContent() {
  // ✅ SELECTORES INDIVIDUALES (evita infinite loops)
  const dispatch = useAppDispatch()
  const user = useUser()
  const currentView = useCurrentView()
  const openCheckin = useOpenCheckin()
  
  // Pull-to-refresh state (local)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  
  // ✅ USAR SELECTOR INDIVIDUAL para loading
  const isLoading = useAuthLoading()

  // 🔄 Pull-to-refresh logic (SIMPLIFICADO)
  const handleRefresh = useCallback(async () => {
    if (!user?.id || isRefreshing) return
    
    setIsRefreshing(true)
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
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [user?.id, isRefreshing]) // Dependencies específicas

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
        return (
          <Suspense fallback={<ViewLoading />}>
            <HomeView />
          </Suspense>
        )
    }
  }

  return (
    <motion.div 
      className="min-h-dvh bg-white text-gray-900 flex flex-col relative overflow-hidden"
      style={{ y: pullDistance * 0.3 }} // Efecto de arrastrar toda la pantalla
    >
      {/* 🎯 Pull-to-refresh moderno estilo iPhone */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: Math.min(pullDistance / 60, 1),
              scale: Math.min(0.8 + (pullDistance / 120), 1.2)
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center"
            style={{ 
              height: `${Math.min(pullDistance, 100)}px`,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div 
              className="text-center"
              animate={{ 
                rotate: pullDistance > 60 ? 180 : 0,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {pullDistance > 60 ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="space-y-2"
                >
                  <div className="w-6 h-6 mx-auto border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-xs text-gray-600 font-medium">Suelta para actualizar</p>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ y: Math.sin(Date.now() / 200) * 2 }}
                  className="space-y-2"
                >
                  <div className="text-2xl">⬇️</div>
                  <p className="text-xs text-gray-500">Tira hacia abajo</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header fijo */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">
                Fuego Rewards <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">SPA</span>
              </h1>
              <p className="text-xs text-gray-500">
                {user ? `¡Hola ${user.first_name || 'Usuario'}!` : '¡Registra tus visitas y participa!'}
              </p>
            </div>
            <VersionToggle currentVersion="spa" />
          </div>
        </div>
      </header>

      {/* Contenido principal - con animación de refresh moderna */}
      <motion.main 
        className="flex-1 overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        animate={{ 
          y: isRefreshing ? 10 : 0,
          scale: isRefreshing ? 0.98 : 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div 
          className="px-4 pt-4"
          animate={{ opacity: isRefreshing ? 0.7 : 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* 🔄 Loading indicator moderno durante refresh */}
          <AnimatePresence>
            {isRefreshing && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center py-6 mb-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full mr-3"
                />
                <motion.span 
                  className="text-sm text-gray-600 font-medium"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Actualizando datos...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {renderCurrentView()}
        </motion.div>
      </motion.main>

      {/* Checkin Sheet */}
      <CheckinSheet 
        open={openCheckin} 
        onClose={() => dispatch(setOpenCheckin(false))} 
      />

      {/* Bottom Navigation fijo */}
      <BottomNav onCheckinClick={() => dispatch(setOpenCheckin(true))} />
    </motion.div>
  )
}

// 🎯 COMPONENTE PRINCIPAL SIN PROVIDER DUPLICADO
export function SPAAppShell() {
  return (
    <ClientGuard>
      <SPAContent />
    </ClientGuard>
  )
}
