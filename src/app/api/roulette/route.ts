import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  // 1) Autenticación del usuario actual (JWT de las cookies)
  const supaUserSide = createServerComponentClient<Database>({ cookies })
  const {
    data: { user },
    error: authErr,
  } = await supaUserSide.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  // 2) Llamar RPC con service_role (server-only)
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('spin_roulette', { p_user: user.id })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }

  // data es el JSON que retorna tu función (won, prize_id, prize_name, coupon_id)
  return NextResponse.json({ ok: true, result: data })
}