// RUTA: /api/checkin/qr-token
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { cookies } from 'next/headers'
import { signPayload } from '@/lib/utils/qr'

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  // Traer el unique_code del perfil del usuario actual
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('unique_code')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ ok: false, error: 'Perfil no encontrado' }, { status: 404 })
  }

  // Payload con expiración de 5 minutos (exp en segundos)
  const code = profile.unique_code
  if (!code) {
    return NextResponse.json({ ok: false, error: 'unique_code no disponible' }, { status: 500 })
  }
  const payload = { c: code, u: user.id, exp: Math.floor(Date.now() / 1000) + 5 * 60 }
  const qrData = signPayload(payload)

  return NextResponse.json({ ok: true, qrData, code: profile.unique_code })
}