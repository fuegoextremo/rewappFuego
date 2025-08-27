'use client'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { BottomNav } from '@/components/client/BottomNav'
import CheckinSheet from '@/components/client/CheckinSheet'
import '@/styles/client-shell.css' // estilos puntuales (ver sección 6)

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [openCheckin, setOpenCheckin] = useState(false)

  return (
    <div className="mx-auto max-w-sm min-h-dvh bg-white text-gray-900">
      {/* Header compacto estilo app */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold">Fuego Rewards</h1>
          <p className="text-xs text-gray-500">
            ¡Registra tus visitas y participa en la ruleta!
          </p>
        </div>
      </header>

      {/* Contenido */}
      <main className="pb-20">{children}</main>

      <CheckinSheet open={openCheckin} onClose={() => setOpenCheckin(false)} />

      {/* Bottom nav persistente */}
      <BottomNav onCheckinClick={() => setOpenCheckin(true)} />
    </div>
  )
}