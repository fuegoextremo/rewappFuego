

'use client'

import { useEffect } from 'react'
import { useUser } from '@/store/hooks'
import { useSystemSettings } from '@/hooks/use-system-settings'
import confetti from 'canvas-confetti'
import UserQR from './UserQR'
import BottomSheet from '@/components/ui/BottomSheet'

export default function CheckinSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const user = useUser()
  const { data: settings } = useSystemSettings()

  // 🎯 Escuchar cuando se realiza un check-in exitoso para cerrar automáticamente
  useEffect(() => {
    if (!open) return

    const handleCheckinSuccess = () => {
      console.log('🎉 CheckinSheet: Check-in exitoso detectado, cerrando automáticamente')
      
      // 🏆 Verificar si se completó un premio de racha
      const currentStreak = user?.current_streak || 0
      const prizeLevels = [3, 5, 10, 15, 20, 25, 30]
      
      if (prizeLevels.includes(currentStreak)) {
        console.log(`🎉 ¡Premio de racha completado: ${currentStreak} días consecutivos!`)
        
        // Activar confetti simple para premio de racha
        setTimeout(() => {
          const primaryColor = settings?.company_theme_primary || "#D73527"
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: [primaryColor, '#FFD700', '#FFA500', '#ffffff']
          })
        }, 500)
      }
      
      onClose() // Cerrar inmediatamente junto con el toast
    }

    // Escuchar el evento específico de check-in exitoso
    window.addEventListener('checkin-success', handleCheckinSuccess)

    return () => {
      window.removeEventListener('checkin-success', handleCheckinSuccess)
    }
  }, [open, onClose, user?.current_streak, settings?.company_theme_primary])
  return (
    <BottomSheet
      isOpen={open}
      onClose={onClose}
      title="Check‑in"
    >
      <div className="px-6 pb-6">
        <div className="text-center space-y-1 mb-6">
          <p className="text-xs tracking-wider text-gray-500">MI CÓDIGO</p>
        </div>

        <div className="flex justify-center mb-6">
          <UserQR size={240} />
        </div>

        <p className="text-center text-xs text-gray-600 mb-6">
          Muestra este QR al personal de la sucursal para registrar tu visita.
        </p>

        <button
          onClick={onClose}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </BottomSheet>
  )
}