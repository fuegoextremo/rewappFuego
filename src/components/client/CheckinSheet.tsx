

'use client'

import UserQR from './UserQR'

export default function CheckinSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl animate-[slideUp_220ms_ease-out]"
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-200" />

        <div className="text-center space-y-1">
          <p className="text-xs tracking-wider text-gray-500">MI CÓDIGO</p>
          <h3 className="text-2xl font-extrabold">Check‑in</h3>
        </div>

        <div className="mt-4 flex justify-center">
          <UserQR size={240} />
        </div>

        <p className="mt-3 text-center text-xs text-gray-600">
          Muestra este QR al personal de la sucursal para registrar tu visita.
        </p>

        <button
          onClick={onClose}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gray-100 text-gray-800 font-semibold"
        >
          Cerrar
        </button>
      </div>

      {/* Animación */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: .98 }
          to   { transform: translateY(0);    opacity: 1 }
        }
      `}</style>
    </>
  )
}