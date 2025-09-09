'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Trophy } from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { setCurrentView } from '@/store/slices/uiSlice'

type ResultSheetProps = {
  open: boolean
  onClose: () => void
  won: boolean
  prizeName?: string | null
}

export default function ResultSheet({ open, onClose, won, prizeName }: ResultSheetProps) {
  const dispatch = useAppDispatch()
  
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

  return (
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
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
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[85vh] overflow-hidden"
            style={{ 
              transformOrigin: 'bottom',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              perspective: 1000,
              transform: 'translate3d(0,0,0)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {won ? '🎉 ¡Resultado!' : '🎲 Resultado'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="px-6 pb-6 pt-4">
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
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-b from-green-100 to-green-50 flex items-center justify-center border border-green-200">
                      <Trophy className="w-10 h-10 text-green-600" />
                    </div>
                  </motion.div>

                  {/* Animated text content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <p className="text-xs tracking-wider text-gray-500 uppercase">Felicidades</p>
                    <h3 className="text-3xl font-extrabold text-green-600">¡Ganaste!</h3>
                    <p className="text-lg font-semibold text-gray-900">{prizeName ?? 'Premio'}</p>
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
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-green-600 px-5 text-white font-semibold shadow hover:bg-green-700 transition-colors active:translate-y-[1px]"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}