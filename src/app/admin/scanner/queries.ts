"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export type ScanActivity = {
  id: string
  type: 'checkin' | 'redemption'
  user_name: string
  user_unique_code: string
  timestamp: string
  branch_name?: string
  prize_name?: string
  verified_by_name: string
}

export async function getRecentScanActivity(limit: number = 5): Promise<ScanActivity[]> {
  const supabase = createAdminClient()
  
  try {
    const activities: ScanActivity[] = []

    // Obtener check-ins recientes - query simple
    const { data: checkins } = await supabase
      .from('check_ins')
      .select('id, created_at, user_id, branch_id, verified_by')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Obtener redenciones recientes - query simple  
    const { data: redemptions } = await supabase
      .from('coupons')
      .select('id, redeemed_at, user_id, prize_id, redeemed_by')
      .not('redeemed_at', 'is', null)
      .order('redeemed_at', { ascending: false })
      .limit(limit)

    // Para check-ins, obtener detalles de usuarios y sucursales
    if (checkins) {
      for (const checkin of checkins) {
        if (!checkin.user_id || !checkin.verified_by) continue

        // Obtener usuario
        const { data: user } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, unique_code')
          .eq('id', checkin.user_id)
          .single()

        // Obtener email del usuario (siempre disponible)
        const { data: authUser } = await supabase.auth.admin.getUserById(checkin.user_id)
        const userEmail = authUser.user?.email || `Usuario #${user?.unique_code || 'N/A'}`

        // Obtener sucursal
        const { data: branch } = checkin.branch_id ? await supabase
          .from('branches')
          .select('name')
          .eq('id', checkin.branch_id)
          .single() : { data: null }

        // Obtener verificador
        const { data: verifier } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, unique_code')
          .eq('id', checkin.verified_by)
          .single()

        // Obtener email del verificador
        const { data: authVerifier } = await supabase.auth.admin.getUserById(checkin.verified_by)
        const verifierEmail = authVerifier.user?.email || `Staff #${verifier?.unique_code || 'N/A'}`

        activities.push({
          id: checkin.id,
          type: 'checkin',
          user_name: userEmail,
          user_unique_code: user?.unique_code || '',
          timestamp: checkin.created_at || '',
          branch_name: branch?.name,
          verified_by_name: verifierEmail
        })
      }
    }

    // Para redenciones, obtener detalles de usuarios y premios
    if (redemptions) {
      for (const redemption of redemptions) {
        if (!redemption.user_id || !redemption.redeemed_by) continue

        // Obtener usuario
        const { data: user } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, unique_code')
          .eq('id', redemption.user_id)
          .single()

        // Obtener email del usuario (siempre disponible)
        const { data: authUser2 } = await supabase.auth.admin.getUserById(redemption.user_id)
        const userEmail2 = authUser2.user?.email || `Usuario #${user?.unique_code || 'N/A'}`

        // Obtener premio
        const { data: prize } = redemption.prize_id ? await supabase
          .from('prizes')
          .select('name')
          .eq('id', redemption.prize_id)
          .single() : { data: null }

        // Obtener verificador
        const { data: verifier } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, unique_code')
          .eq('id', redemption.redeemed_by)
          .single()

        // Obtener email del verificador
        const { data: authVerifier2 } = await supabase.auth.admin.getUserById(redemption.redeemed_by)
        const verifierEmail2 = authVerifier2.user?.email || `Staff #${verifier?.unique_code || 'N/A'}`

        activities.push({
          id: redemption.id,
          type: 'redemption',
          user_name: userEmail2,
          user_unique_code: user?.unique_code || '',
          timestamp: redemption.redeemed_at || '',
          prize_name: prize?.name,
          verified_by_name: verifierEmail2
        })
      }
    }

    // Ordenar por timestamp más reciente
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

  } catch (error) {
    console.error('Error fetching scan activity:', error)
    return []
  }
}

export async function getScanHistory(): Promise<{
  activities: ScanActivity[]
  totalCount: number
  totalPages: number
}> {
  // Por ahora usamos la función simple, después implementaremos paginación
  const activities = await getRecentScanActivity(50)
  
  return {
    activities,
    totalCount: activities.length,
    totalPages: 1
  }
}
