'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { CouponRow } from '@/store/slices/authSlice'

// Importamos desde AnimatedExpiredCouponStack que ya tiene el forceGrayStyle
import CouponCard from './CouponCard'

interface SPAAnimatedCouponStackProps {
  coupons: CouponRow[]
  title: string
  emptyMessage?: string
  emptySubMessage?: string
  hasMore?: boolean
  loading?: boolean
  onLoadMore?: () => void
  total?: number      // 🆕 Total de cupones
}

export default function SPAAnimatedCouponStack({ 
  coupons, 
  title, 
  emptyMessage = "No tienes cupones",
  emptySubMessage = "¡Sigue participando! 🎡",
  hasMore = false,
  loading = false,
  onLoadMore,
  total        // 🆕 Recibir total
}: SPAAnimatedCouponStackProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (coupons.length === 0) {
    return (
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <motion.div 
          className="bg-white p-6 rounded-xl text-center border border-gray-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.p 
            className="text-gray-500 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {emptyMessage}
          </motion.p>
          <motion.p 
            className="text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {emptySubMessage}
          </motion.p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="space-y-4 w-full max-w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header con botón para expandir/contraer */}
      <div className="flex items-center justify-between">
        <motion.h3 
          className="font-semibold text-gray-800"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {title} ({total ?? coupons.length})
        </motion.h3>
        
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 active:text-blue-800 transition-colors flex items-center gap-1 touch-manipulation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? '📚 Apilar' : '📋 Ver todos'}
        </motion.button>
      </div>
      
      {/* Container principal */}
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Vista en stack compacto (máximo 4 tarjetas)
            <motion.div
              key="stack"
              className="relative w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {coupons.slice(0, 4).map((coupon, index) => {
                // Cálculos para el stack ordenado - SIN TRANSPARENCIA
                const offsetY = index === 0 ? 0 : (index === 1 ? 8 : index * 10)
                const scale = 1 - (index * 0.03)
                const brightness = 1 + (index * 0.0)
                const saturate = 1 - (index * 0.00)
                const contrast = 1 - (index * 0.1)
                
                return (
                  <motion.div
                    key={coupon.id}
                    className={`w-full ${index > 0 ? 'absolute inset-x-0 top-0' : 'relative'}`}
                    style={{ zIndex: coupons.length - index }}
                    initial={{ 
                      opacity: 1,
                      y: 30,
                      scale: 0.9
                    }}
                    animate={{ 
                      opacity: 1,
                      y: offsetY,
                      scale,
                      filter: `brightness(${brightness}) saturate(${saturate}) contrast(${contrast})`
                    }}
                    transition={{ 
                      duration: 0.5,
                      delay: index * 0.08,
                      type: "spring",
                      stiffness: 100,
                      damping: 18
                    }}
                    onClick={() => setIsExpanded(true)}
                  >
                    <div className="cursor-pointer">
                      <CouponCard coupon={coupon} isInStack={true} stackIndex={index} />
                    </div>
                  </motion.div>
                )
              })}
              
              {/* Indicador de más cupones */}
              {(total ?? coupons.length) > 4 && (
                <motion.div
                  className="absolute top-0 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold z-50"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  +{(total ?? coupons.length) - 4}
                </motion.div>
              )}
              
              {/* Spacer para el stack */}
              <div style={{ height: Math.min((coupons.slice(0, 4).length - 1) * 10, 30) + 16 }} />
            </motion.div>
          ) : (
            // Vista en lista expandida
            <motion.div
              key="list"
              className="space-y-4 w-full"
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
                    y: 20,
                    scale: 0.95
                  }}
                  animate={{ 
                    opacity: 1,
                    y: 0,
                    scale: 1
                  }}
                  transition={{ 
                    duration: 0.4,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                >
                  <CouponCard coupon={coupon} isInStack={false} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {isExpanded && hasMore && onLoadMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: coupons.length * 0.03 + 0.2 }}
          >
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="w-full p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  Cargando más cupones...
                </div>
              ) : (
                '🎫 Cargar más cupones'
              )}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
