

'use client'

import UserQR from './UserQR'
import BottomSheet from '@/components/ui/BottomSheet'

export default function CheckinSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
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