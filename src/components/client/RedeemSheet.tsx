'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Image from 'next/image'
import BottomSheet from '@/components/ui/BottomSheet'
import { useSystemSettings } from '@/hooks/use-system-settings'

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
  const { data: settings } = useSystemSettings()
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
      <div className="relative overflow-hidden">
        {/* 🎨 Fondo circular con color del sistema */}
        <div 
          className="absolute inset-0 h-1/2"
          style={{
            backgroundColor: settings?.company_theme_primary || '#3B82F6',
            clipPath: 'ellipse(100% 100% at 50% 0%)'
          }}
        />
        
        {/* Contenido principal */}
        <div className="relative px-6 pb-6">
          <div className="text-center space-y-1 m-6"> 
            <p className="text-xs tracking-wider text-white/80 uppercase">RECLAMANDO</p>
            <h3 className="text-white font-semibold">{title}</h3> 
            {code && <p className="text-sm text-white/70">#{code}</p>}
          </div>

          <div className="flex justify-center mb-6">
            {err ? (
              <p className="text-sm text-red-600">{err}</p>
            ) : img ? (
              <Image
                src={img}
                alt="QR para reclamar"
                width={250}
                height={250}
                className="rounded-2xl p-4 bg-white shadow-2xl"
                unoptimized
                priority
              />
            ) : (
              <div className="h-[250px] w-[250px] rounded-2xl border flex items-center justify-center bg-white/10 backdrop-blur">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
      </div>
    </BottomSheet>
  )
}