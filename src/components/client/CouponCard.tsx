'use client'
import { useState } from 'react'
import { useSystemSettings } from '@/hooks/use-system-settings'
import RedeemSheet from './RedeemSheet'

type CouponRow = {
  id: string
  unique_code: string
  expires_at: string | null
  is_redeemed: boolean | null
  redeemed_at: string | null
  source: string | null
  created_at: string | null
  prizes: { name: string; image_url: string | null } | null
}

export default function CouponCard({ coupon }: { coupon: CouponRow }) {
  const [open, setOpen] = useState(false)
  const { data: settings } = useSystemSettings()
  
  const primaryColor = settings?.company_theme_primary || '#D73527'
  const secondaryColor = settings?.company_theme_secondary || '#F97316'
  
  // Debug temporal
  console.log('CouponCard - settings:', settings)
  console.log('CouponCard - primaryColor:', primaryColor)
  
  const now = Date.now()
  const active = !coupon.is_redeemed && (!coupon.expires_at || new Date(coupon.expires_at).getTime() >= now)

  const dt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
  const exp = coupon.expires_at ? dt.format(new Date(coupon.expires_at)) : 'Sin caducidad'

  return (
    <article className={`relative ticket-shape ${active ? 'bg-black text-white' : 'bg-white text-gray-800'} `}>
      <div className="px-4 py-4">
        {/* Sección superior: información del premio */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs opacity-70 uppercase tracking-wide">Premio válido</p>
            <h4 className={`font-bold text-lg truncate ${active ? 'text-white' : 'text-gray-800'}`} style={active ? { color: primaryColor } : {}}>
              {coupon.prizes?.name ?? 'Premio'}
            </h4>
            <p className={`text-xs ${active ? 'opacity-70' : 'text-gray-500'}`}>
              Válido hasta {exp}
            </p>
          </div>
          {!active && (
            <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
              {coupon.is_redeemed ? '✓ Usado' : '⚠ Vencido'}
            </span>
          )}
        </div>

        {/* Línea divisoria punteada */}
        <div className="my-4 border-t-2 border-dashed border-gray-300"></div>

        {/* Sección inferior: código y acción */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-[10px] uppercase tracking-widest font-semibold ${active ? 'text-white' : 'text-gray-500'}`} style={active ? { color: primaryColor } : {}}>
              Código del cupón
            </div>
            <div className="font-mono text-lg font-bold tracking-wider">
              {coupon.unique_code}
            </div>
          </div>
          {active && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors shadow-md hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Reclamar
            </button>
          )}
        </div>
      </div>

      <RedeemSheet open={open} onClose={() => setOpen(false)} couponId={coupon.id} />
    </article>
  )
}