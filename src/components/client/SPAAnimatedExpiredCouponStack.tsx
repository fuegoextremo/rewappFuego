'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CouponRow } from '@/store/slices/authSlice'
import CouponCard from './CouponCard'

interface SPAAnimatedExpiredCouponStackProps {
  coupons: CouponRow[]
  title?: string
  hasMore?: boolean
  loading?: boolean
  onLoadMore?: () => void
  total?: number      // 🆕 Total de cupones
}

export default function SPAAnimatedExpiredCouponStack({ 
  coupons, 
  title = "Cupones usados/vencidos",
  hasMore = false,
  loading = false,
  onLoadMore,
  total        // 🆕 Recibir total
}: SPAAnimatedExpiredCouponStackProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (coupons.length === 0) {
    return null // No mostrar nada si no hay cupones caducados
  }

  return (
    <motion.div 
      className="space-y-4 w-full max-w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header con botón para expandir/contraer - estilo más sutil para caducados */}
      <div className="flex items-center justify-between">
        <motion.h3 
          className="font-medium text-gray-500 text-sm"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {title} ({total ?? coupons.length})
        </motion.h3>
        
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-400 active:text-gray-600 transition-colors flex items-center gap-1 touch-manipulation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? 'Apilar' : 'Ver historial'}
        </motion.button>
      </div>
      
      {/* Container principal */}
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Vista en stack compacto (máximo 3 tarjetas para caducados)
            <motion.div
              key="expired-stack"
              className="relative w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {coupons.slice(0, 3).map((coupon, index) => {
                // Cálculos para el stack ordenado - igual que el original pero más compacto
                const offsetY = index === 0 ? 0 : (index === 1 ? 6 : index * 8) // Espaciado más compacto
                const scale = 1 - (index * 0.02) // Reducción más sutil
                const brightness = 1 - (index * 0.05) // Oscurecimiento muy sutil
                const saturate = 1 - (index * 0.02) // Desaturación mínima
                
                return (
                  <motion.div
                    key={coupon.id}
                    className={`w-full ${index > 0 ? 'absolute inset-x-0 top-0' : 'relative'}`}
                    style={{ zIndex: coupons.length - index }}
                    initial={{ 
                      opacity: 1,
                      y: 20,
                      scale: 0.95
                    }}
                    animate={{ 
                      opacity: 1,
                      y: offsetY,
                      scale,
                      filter: `brightness(${brightness}) saturate(${saturate})`
                    }}
                    transition={{ 
                      duration: 0.4,
                      delay: index * 0.06,
                      type: "spring",
                      stiffness: 120,
                      damping: 20
                    }}
                    onClick={() => setIsExpanded(true)}
                  >
                    <div className="cursor-pointer">
                      {/* 🎯 Aquí usamos forceGrayStyle=true para todos los cupones caducados */}
                      <CouponCard 
                        coupon={coupon} 
                        isInStack={true} 
                        stackIndex={index}
                        forceGrayStyle={true}
                      />
                    </div>
                  </motion.div>
                )
              })}
              
              {/* Indicador de más cupones - en gris para caducados */}
              {coupons.length > 3 && (
                <motion.div
                  className="absolute top-0 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium z-50"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  +{coupons.length - 3}
                </motion.div>
              )}
              
              {/* Spacer para el stack - más compacto para caducados */}
              <div style={{ height: Math.min((coupons.slice(0, 3).length - 1) * 8, 16) + 12 }} />
            </motion.div>
          ) : (
            // Vista en lista expandida
            <motion.div
              key="expired-list"
              className="space-y-3 w-full" // Espaciado más compacto
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {coupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id}
                  initial={{ 
                    opacity: 0, 
                    y: 15,
                    scale: 0.98
                  }}
                  animate={{ 
                    opacity: 1,
                    y: 0,
                    scale: 1
                  }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.03, // Animación más rápida
                    type: "spring",
                    stiffness: 120,
                    damping: 18
                  }}
                >
                  {/* 🎯 Todos los cupones en la lista expandida también usan gris */}
                  <CouponCard 
                    coupon={coupon} 
                    isInStack={false}
                    forceGrayStyle={true}
                  />
                </motion.div>
              ))}
              
              {/* 📚 Botón "Cargar más" para paginación */}
              {hasMore && (
                <motion.div
                  className="pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: coupons.length * 0.03 + 0.2 }}
                >
                  <button
                    onClick={onLoadMore}
                    disabled={loading}
                    className="w-full p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Cargando más cupones...
                      </div>
                    ) : (
                      '📚 Cargar más cupones'
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
