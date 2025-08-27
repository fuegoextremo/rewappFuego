import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { signPayload } from '@/lib/utils/qr'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supa = createServerComponentClient<Database>({ cookies })
  const { data: { user }, error: authErr } = await supa.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const couponId = params.id

  // 1) Aseguramos que el cupón pertenezca al usuario y esté activo (no redimido / no vencido)
  const { data: coupon, error } = await supa
    .from('coupons')
    .select('id, user_id, is_redeemed, expires_at, unique_code, prizes(name)')
    .eq('id', couponId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !coupon) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }
  if (coupon.is_redeemed) {
    return NextResponse.json({ ok: false, error: 'already_redeemed' }, { status: 400 })
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: 'expired' }, { status: 400 })
  }

  // 2) Generamos token corto con expiración (ej. 5 minutos)
  const exp = Math.floor(Date.now() / 1000) + 5 * 60
  const token = signPayload({ c: coupon.id, u: user.id, exp })

  // 3) Construimos la cadena a codificar como QR
  //     (URL para la vista del verificador o un deep-link interno)
  const qrData = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/staff/redeem?t=${token}`

  return NextResponse.json({
    ok: true,
    token,
    qrData,
    prizeName: coupon.prizes?.name ?? 'Premio',
    code: coupon.unique_code,
    exp,
  })
}