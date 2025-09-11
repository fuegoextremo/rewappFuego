'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Image from 'next/image'
import BottomSheet from '@/components/ui/BottomSheet'

type Props = {
  open: boolean
  onClose: () => void
  couponId: string
}

type ApiResp = {
  ok: boolean
  qrData?: string
  prizeName?: string
  code?: string
  error?: string
}

export default function RedeemSheet({ open, onClose, couponId }: Props) {
  const [img, setImg] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('Reclamando…')
  const [code, setCode] = useState<string>('—')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function run() {
      setErr(null); setImg(null); setTitle('Reclamando…'); setCode('—')
      try {
        const res = await fetch(`/api/coupons/${couponId}/redeem-token`)
        const json: ApiResp = await res.json()
        if (!json.ok || !json.qrData) throw new Error(json.error || 'error')
        const dataUrl = await QRCode.toDataURL(json.qrData, { margin: 1, width: 240 })
        if (!mounted) return
        setImg(dataUrl)
        setTitle(json.prizeName ?? 'Premio')
        setCode(json.code ?? '')
      } catch (e) {
        console.error('Error generando QR de cupón:', e)
        if (!mounted) return
        setErr('No se pudo generar el QR. Intenta de nuevo.')
      }
    }
    if (open) run()
    return () => { mounted = false }
  }, [open, couponId])

  // 🎯 Escuchar cuando el cupón es redimido exitosamente para cerrar automáticamente
  useEffect(() => {
    if (!open || !couponId) return

    const handleUserDataUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail
      
      // Si es un cupón que fue redimido y es el cupón que estamos mostrando
      if (type === 'coupon' && data?.new?.id === couponId && data?.new?.is_redeemed && !data?.old?.is_redeemed) {
        console.log('🎉 RedeemSheet: Cupón redimido exitosamente, cerrando automáticamente')
        onClose() // Cerrar inmediatamente junto con el toast
      }
    }

    const handleRedemptionSuccess = () => {
      console.log('🎉 RedeemSheet: Premio de ruleta detectado, cerrando automáticamente')
      onClose() // Cerrar inmediatamente junto con el toast
    }

    // Escuchar el evento personalizado que ya dispara RealtimeProvider
    window.addEventListener('user-data-updated', handleUserDataUpdate as EventListener)
    // Escuchar evento específico de premio de ruleta
    window.addEventListener('redemption-success', handleRedemptionSuccess)

    return () => {
      window.removeEventListener('user-data-updated', handleUserDataUpdate as EventListener)
      window.removeEventListener('redemption-success', handleRedemptionSuccess)
    }
  }, [open, couponId, onClose])

  return (
    <BottomSheet
      isOpen={open}
      onClose={onClose}
      title={title}
    >
      <div className="px-6 pb-6 ">
        <div className="text-center space-y-1 m-6"> 
          <p className="text-xs tracking-wider text-gray-500">RECLAMANDO</p>
          <h3>{title}</h3> 
          {code && <p className="text-sm text-gray-500">#{code}</p>}
        </div>

        <div className="flex justify-center mb-6">
          {err ? (
            <p className="text-sm text-red-600">{err}</p>
          ) : img ? (
            <Image
              src={img}
              alt="QR para reclamar"
              width={240}
              height={240}
              className="rounded-2xl border p-2"
              unoptimized
              priority
            />
          ) : (
            <div className="h-48 w-48 rounded-2xl border flex items-center justify-center">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mb-6">
          Muestra este código QR al mesero de cualquier sucursal para reclamar tu premio.
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