'use client'

import { useState } from 'react'
import CheckinSheet from '@/components/client/CheckinSheet'
import { BottomNav } from '@/components/client/BottomNav'

interface ClientThemeProviderProps {
  children: React.ReactNode
}

export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  const [openCheckin, setOpenCheckin] = useState(false)

  return (
    <>
      {children}
      <CheckinSheet open={openCheckin} onClose={() => setOpenCheckin(false)} />
      <BottomNav onCheckinClick={() => setOpenCheckin(true)} />
    </>
  )
}
