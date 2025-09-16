// RUTA: /api/checkin
// Usa SERVICE_ROLE para ejecutar process_checkin en DB
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { user_id, branch_id, spins = 1 } = await req.json()

  const supaAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // <- SOLO en servidor
  )

  const { data, error } = await supaAdmin.rpc('process_checkin', {
    p_user: user_id,
    p_branch: branch_id,
    p_spins: spins
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}