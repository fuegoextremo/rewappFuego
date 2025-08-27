'use client'
import { useState } from 'react'
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
  const now = Date.now()
  const active = !coupon.is_redeemed && (!coupon.expires_at || new Date(coupon.expires_at).getTime() >= now)

  const dt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
  const exp = coupon.expires_at ? dt.format(new Date(coupon.expires_at)) : 'Sin caducidad'

  return (
    <article className={`rounded-2xl border p-4 ${active ? 'bg-black text-white border-neutral-900' : 'bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs opacity-70">{active ? 'Válido por' : 'Válido por'}</p>
          <h4 className={`font-semibold truncate ${active ? 'text-red-400' : 'text-gray-800'}`}>
            {coupon.prizes?.name ?? 'Premio'}
          </h4>
          <p className={`text-xs ${active ? 'opacity-70' : 'text-gray-500'}`}>
            Válido hasta {exp}
          </p>
        </div>
        {!active && (
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
            {coupon.is_redeemed ? 'Reclamado' : 'Vencido'}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className={`text-[10px] uppercase tracking-wide ${active ? 'opacity-70' : 'text-gray-500'}`}>Cupón</div>
          <div className="font-mono text-sm">{coupon.unique_code}</div>
        </div>
        {active && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white text-gray-900"
          >
            Reclamar <span>📷</span>
          </button>
        )}
      </div>

      <RedeemSheet open={open} onClose={() => setOpen(false)} couponId={coupon.id} />
    </article>
  )
}