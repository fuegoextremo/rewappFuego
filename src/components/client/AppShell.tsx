'use client'

import { Suspense, lazy, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
  
  // 🔐 AUTH MANAGER
  const { isLoading, isAuthenticated } = useAuthManager()
  
  // 🎨 LOCAL STATE
  const [isRefreshing, setIsRefreshingLocal] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState<number | null>(null) // 🎯 Trackear inicio del touch

  // 🔄 Pull-to-refresh logic
  const handleRefresh = useCallback(async () => {
    if (!user?.id || isRefreshing) return
    
    setIsRefreshingLocal(true)
    dispatch(setRefreshing(true))
    
    try {
      console.log('🔄 Iniciando pull-to-refresh...')
      
      // Invalidar consultas específicas que pueden causar problemas
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['streak'] }),
        queryClient.invalidateQueries({ queryKey: ['prizes'] }),
        queryClient.invalidateQueries({ queryKey: ['settings'] }),
        queryClient.invalidateQueries({ queryKey: ['user'] })
      ])
      
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
  }, [user?.id, isRefreshing, dispatch, queryClient])

  // Touch handlers for pull-to-refresh estilo iPhone
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return
    
    const touch = e.touches[0]
    setStartY(touch.clientY) // 🎯 Guardamos la posición inicial
    setPullDistance(0)
  }, [isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing || startY === null) return
    
    const touch = e.touches[0]
    const currentY = touch.clientY
    const deltaY = currentY - startY // 🎯 Diferencia desde el inicio
    
    // Solo activar si jalamos hacia abajo desde el inicio
    if (deltaY > 0) {
      const distance = Math.max(0, Math.min(deltaY, 150)) // 🎯 Límite máximo 150px
      setPullDistance(distance)
    } else {
      setPullDistance(0) // 🎯 Si jalamos hacia arriba, resetear
    }
  }, [isRefreshing, startY])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 80 && !isRefreshing) { // 🎯 Tolerancia aumentada a 80
      handleRefresh()
      // 🎯 No reseteamos pullDistance aquí - se resetea en handleRefresh al terminar
    } else if (!isRefreshing) { // 🎯 Solo resetear si no estamos refrescando
      setPullDistance(0)
    }
    setStartY(null) // 🎯 Limpiar la posición inicial
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
    <motion.div 
      className="min-h-dvh bg-white text-gray-900 flex flex-col relative overflow-hidden"
      animate={{ 
        y: pullDistance * 0.3 // 🎯 Menos movimiento ya que el indicador empuja naturalmente
      }}
      transition={{ 
        type: "tween", 
        duration: 0.1, // 🎯 Súper rápido para seguir el dedo
        ease: "linear" // 🎯 Sin easing para movimiento directo
      }}
    >
      {/* 🎯 Pull-to-refresh moderno estilo iPhone - Crea espacio real */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && ( /* 🎯 Mostrar durante pull O refresh */
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: isRefreshing ? 60 : Math.min(pullDistance, 120), // 🎯 Altura fija durante refresh
              opacity: isRefreshing ? 1 : Math.min(pullDistance / 80, 1)
            }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full flex items-center justify-center overflow-hidden"
            style={{ 
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(0,0,0,0.05)' // 🎯 Sutil separación
            }}
            transition={{ 
              type: "tween", 
              duration: isRefreshing ? 0.3 : 0.1, // 🎯 Más suave durante refresh
              ease: isRefreshing ? "easeOut" : "linear"
            }}
          >
            <div className="text-center py-2"> {/* 🎯 Añadimos padding vertical */}
              {isRefreshing ? ( /* 🎯 Estado: Refrescando */
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="space-y-1"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 mx-auto border-2 border-gray-300 border-t-blue-500 rounded-full"
                  />
                  <motion.p 
                    className="text-xs text-gray-600 font-medium"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Actualizando datos...
                  </motion.p>
                </motion.div>
              ) : pullDistance > 80 ? ( /* 🎯 Estado: Listo para refresh */
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="space-y-1"
                >
                  <motion.div
                    className="text-xl"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🔄
                  </motion.div>
                  <p className="text-xs text-blue-600 font-medium">Suelta para actualizar</p>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ y: Math.sin(Date.now() / 500) * 2 }} // 🎯 Menos movimiento
                  transition={{ duration: 2, repeat: Infinity }}
                  className="space-y-1" // 🎯 Menos espacio
                >
                  <motion.div
                    className="text-xl" // 🎯 Más pequeño
                    animate={{ 
                      scale: [1, 1.05, 1], // 🎯 Menos escalado
                      rotate: [0, 3, -3, 0] // 🎯 Menos rotación
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ⬇️
                  </motion.div>
                  <p className="text-xs text-gray-500">Tira hacia abajo</p>
                </motion.div>
              )}
            </div> {/* 🎯 Cerramos el div sin rotación */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal con animaciones suaves */}
      <motion.main 
        className="flex-1 pb-20 overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        animate={{ 
          scale: isRefreshing ? 0.97 : (pullDistance > 60 ? 0.99 : 1), // 🎯 Escala gradual
          opacity: pullDistance > 0 ? Math.max(0.85, 1 - pullDistance * 0.002) : 1 // 🎯 Fade gradual
        }}
        transition={{ 
          type: "tween", 
          duration: 0.15, // 🎯 Rápido pero suave
          ease: "easeOut"
        }}
      >
        <motion.div 
          className="px-4 pt-4"
          animate={{ 
            opacity: isRefreshing ? 0.7 : 1
          }}
          transition={{ duration: 0.2 }} // 🎯 Más rápido
        >
          {/* 🎯 Ya no necesitamos indicador extra - el principal se encarga */}
          
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
