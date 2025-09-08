'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface PullToRefreshIndicatorProps {
  /** Current pull distance */
  pullDistance: number
  /** Whether refresh was triggered */
  isTriggered: boolean
  /** Whether currently refreshing */
  isRefreshing: boolean
  /** Pull progress (0-1) */
  pullProgress: number
  /** Show the indicator */
  show: boolean
}

export function PullToRefreshIndicator({
  pullDistance,
  isTriggered,
  isRefreshing,
  pullProgress,
  show
}: PullToRefreshIndicatorProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: Math.min(pullProgress, 1),
            scale: Math.min(0.8 + (pullProgress * 0.4), 1.2)
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
              rotate: isTriggered ? 180 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {isRefreshing ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="space-y-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 mx-auto border-2 border-gray-300 border-t-blue-500 rounded-full"
                />
                <p className="text-xs text-gray-600 font-medium">Actualizando...</p>
              </motion.div>
            ) : isTriggered ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="space-y-2"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-2xl"
                >
                  🔄
                </motion.div>
                <p className="text-xs text-blue-600 font-medium">Suelta para actualizar</p>
              </motion.div>
            ) : (
              <motion.div
                animate={{ y: Math.sin(Date.now() / 200) * 2 }}
                className="space-y-2"
              >
                <motion.div
                  className="text-2xl"
                  animate={{ 
                    scale: [1, 1 + (pullProgress * 0.3)]
                  }}
                  transition={{ duration: 0.2 }}
                >
                  ⬇️
                </motion.div>
                <p className="text-xs text-gray-500">Tira hacia abajo</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface PullToRefreshWrapperProps {
  /** Current pull distance */
  pullDistance: number
  /** Whether currently refreshing */
  isRefreshing: boolean
  /** Touch event handlers */
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  /** Content */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

export function PullToRefreshWrapper({
  pullDistance,
  isRefreshing,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  children,
  className = ""
}: PullToRefreshWrapperProps) {
  return (
    <motion.div 
      className={`relative overflow-hidden ${className}`}
      style={{ y: pullDistance * 0.3 }} // Efecto de arrastrar toda la pantalla
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </motion.div>
  )
}
