'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import RedeemSheet from '@/components/client/RedeemSheet'

interface ModalContextType {
  openRedeemModal: (couponId: string) => void
  closeRedeemModal: () => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [redeemModal, setRedeemModal] = useState<{ isOpen: boolean; couponId: string | null }>({
    isOpen: false,
    couponId: null
  })

  const openRedeemModal = (couponId: string) => {
    setRedeemModal({ isOpen: true, couponId })
  }

  const closeRedeemModal = () => {
    setRedeemModal({ isOpen: false, couponId: null })
  }

  return (
    <ModalContext.Provider value={{ openRedeemModal, closeRedeemModal }}>
      {children}
      
      {/* Modal renderizado a nivel global */}
      <RedeemSheet 
        open={redeemModal.isOpen} 
        onClose={closeRedeemModal} 
        couponId={redeemModal.couponId || ''} 
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
