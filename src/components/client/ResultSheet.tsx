'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Trophy } from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { setCurrentView } from '@/store/slices/uiSlice'
import { useSystemSettings } from '@/hooks/use-system-settings'


type ResultSheetProps = {
  open: boolean
  onClose: () => void
  won: boolean
  prizeName?: string | null
}

export default function ResultSheet({ open, onClose, won, prizeName }: ResultSheetProps) {
  const dispatch = useAppDispatch()
  const { data: settings } = useSystemSettings()

  const handleGoToCoupons = () => {
    onClose()
    dispatch(setCurrentView('coupons'))
  }
  
  // cerrar con ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Renderizar usando Portal para escapar del contexto de z-index
  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut"
            }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] pointer-events-none"
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 35, 
              stiffness: 350,
              mass: 1,
              restDelta: 0.001,
              restSpeed: 0.001
            }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[9999] max-h-[85vh] overflow-hidden pointer-events-auto"
            style={{ 
              transformOrigin: 'bottom',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              perspective: 1000,
              transform: 'translate3d(0,0,0)'
            }}
          >
            {/* Container con overflow hidden para el fondo circular */}
            <div className="relative overflow-hidden h-full">
              {/* 🎨 Fondo circular con color del sistema */}
              <div 
                className="absolute inset-0 h-1/4"
                style={{
                  backgroundColor: settings?.company_theme_primary || '#3B82F6',
                  clipPath: 'ellipse(100% 100% at 50% 0%)'
                }}
              />
              
              {/* Header */}
              <div className="relative flex items-center justify-between px-6 py-4">
                <h2 className="text-lg font-semibold text-white">
                  {won ? '¡Resultado!' : 'Resultado'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>
              
              {/* Content */}
              <div className="relative px-6 pb-6 pt-4">
              {won ? (
                <div className="text-center space-y-4">
                  {/* Animated trophy icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      damping: 15,
                      stiffness: 300,
                      delay: 0.2
                    }}
                    className="flex justify-center mb-4"
                  >
                    <div 
                      className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-xl bg-white"
                    >
                      <Trophy 
                        className="w-10 h-10"
                        style={{ color: settings?.company_theme_primary || '#3B82F6' }}
                      />
                    </div>
                  </motion.div>

                  {/* Animated text content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <h3 
                      className="text-xl font-extrabold"
                      style={{ color: settings?.company_theme_primary || '#3B82F6' }}
                    >
                      ¡Felicidades Ganaste!
                    </h3>
                    <p className="text-3xl font-semibold text-gray-900">{prizeName ?? 'Premio'}</p>
                    <p className="text-sm text-gray-600">
                      Reclama tu premio en cualquier sucursal.
                    </p>
                  </motion.div>

                  {/* Animated buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                    className="mt-6 grid gap-3"
                  >
                    <button
                      onClick={handleGoToCoupons}
                      className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-white font-semibold shadow transition-colors active:translate-y-[1px]"
                      style={{
                        backgroundColor: settings?.company_theme_primary || '#3B82F6'
                      }}
                      onMouseEnter={(e) => {
                        const color = settings?.company_theme_primary || '#3B82F6'
                        // Crear una versión más oscura para hover
                        e.currentTarget.style.backgroundColor = `${color}dd`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = settings?.company_theme_primary || '#3B82F6'
                      }}
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Reclamar Premio
                    </button>
                    <button
                      onClick={onClose}
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 px-5 text-gray-800 font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cerrar
                    </button>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  {/* Animated sad emoji */}
                  <motion.div
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring",
                      damping: 15,
                      stiffness: 300,
                      delay: 0.2
                    }}
                    className="flex justify-center mb-4"
                  >
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center text-4xl border border-gray-200">
                      🎯
                    </div>
                  </motion.div>

                  {/* Animated text content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <h3 className="text-2xl font-extrabold text-gray-700">¡Casi!</h3>
                    <p className="text-sm text-gray-600">Suerte para la próxima 🎡</p>
                    <p className="text-xs text-gray-500 mt-3">
                      Realiza más check-ins para ganar más giros
                    </p>
                  </motion.div>

                  {/* Animated button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                    className="mt-6"
                  >
                    <button
                      onClick={onClose}
                      className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gray-100 px-5 text-gray-800 font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cerrar
                    </button>
                  </motion.div>
                </div>
              )}
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // Renderizar el contenido usando Portal para escapar del contexto de z-index
  if (typeof window === 'undefined') return null
  
  return createPortal(content, document.body)
}