'use client'

import { useEffect } from 'react'
import Link from 'next/link'

type ResultSheetProps = {
  open: boolean
  onClose: () => void
  won: boolean
  prizeName?: string | null
}

export default function ResultSheet({ open, onClose, won, prizeName }: ResultSheetProps) {
  // cerrar con ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-sm translate-y-0 rounded-t-3xl bg-white p-6 shadow-2xl
                   animate-[slideUp_240ms_ease-out]"
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-200" />
        {/* Ilustración opcional */}
        <div className="flex justify-center mb-3">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-b from-red-100 to-white flex items-center justify-center text-4xl">
            🎁
          </div>
        </div>

        {won ? (
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500 -mb-1">Felicidades</p>
            <h3 className="text-3xl font-extrabold text-red-600">¡Ganaste!</h3>
            <p className="text-base font-semibold">{prizeName ?? 'Premio'}</p>
            <p className="text-sm text-gray-600">
              Reclama tu premio en cualquier sucursal de Fuego Extremo.
            </p>

            <div className="mt-4 grid gap-2">
              <Link
                href="/client/coupons"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-5 text-white font-semibold shadow active:translate-y-[1px]"
                onClick={onClose}
              >
                Reclamar
              </Link>
              <button
                onClick={onClose}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 px-5 text-gray-800 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold">¡Casi!</h3>
            <p className="text-sm text-gray-600">Suerte para la próxima 🎡</p>
            <div className="mt-4">
              <button
                onClick={onClose}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gray-100 px-5 text-gray-800 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animación CSS */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0.98; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </>
  )
}