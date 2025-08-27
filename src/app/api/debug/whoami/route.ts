// RUTA: /api/debug/whoami
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  const profile = user
    ? await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle()
    : null

  return NextResponse.json({
    ok: true,
    user: user ? { id: user.id, email: user.email } : null,
    userError: userError?.message ?? null,
    profile: profile?.data ?? null,
    profileError: (profile as any)?.error?.message ?? null,
  })
}