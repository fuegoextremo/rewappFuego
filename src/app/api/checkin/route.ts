// RUTA: /api/checkin
// Usa SERVICE_ROLE para ejecutar process_checkin en DB
// SEGURIDAD: El user_id se obtiene del JWT autenticado, NO del body
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // 1. AUTENTICACIÓN: Verificar usuario desde JWT (NO del body)
    const supabase = createServerComponentClient<Database>({ cookies })
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    
    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: 'No autenticado' }, 
        { status: 401 }
      )
    }

    // 2. Obtener branch_id del body (user_id se ignora por seguridad)
    const { branch_id, spins = 1 } = await req.json()

    if (!branch_id) {
      return NextResponse.json(
        { ok: false, error: 'branch_id es requerido' }, 
        { status: 400 }
      )
    }

    // 3. Ejecutar checkin con el ID del usuario autenticado
    const supaAdmin = createAdminClient()
    const { data, error } = await supaAdmin.rpc('process_checkin', {
      p_user: user.id, // ← ID del JWT, NUNCA del request
      p_branch: branch_id,
      p_spins: spins
    })

    if (error) {
      console.error('Error en process_checkin:', error.message)
      return NextResponse.json(
        { ok: false, error: error.message }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error inesperado en /api/checkin:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}