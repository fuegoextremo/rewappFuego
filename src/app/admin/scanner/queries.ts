"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { unstable_cache, revalidateTag } from "next/cache"

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

// Tag para invalidar el cache después de cada escaneo
const SCAN_ACTIVITY_TAG = 'scan-activity'

async function fetchRecentScanActivity(limit: number): Promise<ScanActivity[]> {
  const supabase = createAdminClient()

  // 2 queries en paralelo con JOINs — reemplaza ~50 queries individuales en serie.
  // user_profiles.email está disponible desde migración 031, eliminando llamadas
  // a auth.admin.getUserById por usuario.
  const [{ data: checkins }, { data: redemptions }] = await Promise.all([
    supabase
      .from('check_ins')
      .select(`
        id,
        created_at,
        user:user_profiles!check_ins_user_id_fkey(email, unique_code),
        branch:branches!check_ins_branch_id_fkey(name),
        verifier:user_profiles!check_ins_verified_by_fkey(email, unique_code)
      `)
      .order('created_at', { ascending: false })
      .limit(limit),

    supabase
      .from('coupons')
      .select(`
        id,
        redeemed_at,
        user:user_profiles!coupons_user_id_fkey(email, unique_code),
        prize:prizes!coupons_prize_id_fkey(name),
        redeemer:user_profiles!coupons_redeemed_by_fkey(email, unique_code)
      `)
      .not('redeemed_at', 'is', null)
      .order('redeemed_at', { ascending: false })
      .limit(limit),
  ])

  const activities: ScanActivity[] = []

  for (const c of checkins ?? []) {
    const user = Array.isArray(c.user) ? c.user[0] : c.user
    const verifier = Array.isArray(c.verifier) ? c.verifier[0] : c.verifier
    const branch = Array.isArray(c.branch) ? c.branch[0] : c.branch
    activities.push({
      id: c.id,
      type: 'checkin',
      user_name: user?.email || `#${user?.unique_code || 'N/A'}`,
      user_unique_code: user?.unique_code || '',
      timestamp: c.created_at || '',
      branch_name: branch?.name,
      verified_by_name: verifier?.email || `#${verifier?.unique_code || 'N/A'}`,
    })
  }

  for (const r of redemptions ?? []) {
    const user = Array.isArray(r.user) ? r.user[0] : r.user
    const redeemer = Array.isArray(r.redeemer) ? r.redeemer[0] : r.redeemer
    const prize = Array.isArray(r.prize) ? r.prize[0] : r.prize
    activities.push({
      id: r.id,
      type: 'redemption',
      user_name: user?.email || `#${user?.unique_code || 'N/A'}`,
      user_unique_code: user?.unique_code || '',
      timestamp: r.redeemed_at || '',
      prize_name: prize?.name,
      verified_by_name: redeemer?.email || `#${redeemer?.unique_code || 'N/A'}`,
    })
  }

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

// Cache de 60 segundos, invalidable por tag después de cada escaneo
const getCachedScanActivity = unstable_cache(
  (limit: number) => fetchRecentScanActivity(limit),
  ['recent-scan-activity'],
  { revalidate: 60, tags: [SCAN_ACTIVITY_TAG] }
)

export async function getRecentScanActivity(limit: number = 5): Promise<ScanActivity[]> {
  try {
    return await getCachedScanActivity(limit)
  } catch (error) {
    console.error('Error fetching scan activity:', error)
    return []
  }
}

// Llamar desde actions.ts después de cada escaneo exitoso para refrescar el cache
export async function invalidateScanActivityCache() {
  revalidateTag(SCAN_ACTIVITY_TAG)
}

async function fetchScanHistoryPaginated(
  page: number,
  pageSize: number
): Promise<{ data: ScanActivity[]; total: number }> {
  const supabase = createAdminClient()
  const offset = (page - 1) * pageSize

  // Paso 1: conteo global + filas paginadas de la vista UNION ALL.
  // Los JOINs se hacen en pasos separados porque PostgREST no infiere FK
  // en vistas UNION ALL (las FK están en las tablas base, no en la vista).
  const [{ count }, { data: rows }] = await Promise.all([
    supabase.from('scan_history').select('*', { count: 'exact', head: true }),
    supabase
      .from('scan_history')
      .select('id, timestamp, type, coupon_code, user_id, verified_by_id, branch_id, prize_id')
      .order('timestamp', { ascending: false })
      .range(offset, offset + pageSize - 1),
  ])

  if (!rows || rows.length === 0) {
    return { data: [], total: count ?? 0 }
  }

  // Paso 2: recolectar IDs únicos para lookups secundarios en paralelo.
  const userIds = [...new Set([
    ...rows.map((r) => r.user_id),
    ...rows.map((r) => r.verified_by_id),
  ].filter(Boolean))]
  const branchIds = [...new Set(rows.map((r) => r.branch_id).filter(Boolean))]
  const prizeIds = [...new Set(rows.map((r) => r.prize_id).filter(Boolean))]

  const [{ data: users }, { data: branches }, { data: prizes }] = await Promise.all([
    userIds.length > 0
      ? supabase.from('user_profiles').select('id, email, unique_code').in('id', userIds)
      : Promise.resolve({ data: [] }),
    branchIds.length > 0
      ? supabase.from('branches').select('id, name').in('id', branchIds)
      : Promise.resolve({ data: [] }),
    prizeIds.length > 0
      ? supabase.from('prizes').select('id, name').in('id', prizeIds)
      : Promise.resolve({ data: [] }),
  ])

  const userMap = new Map((users ?? []).map((u) => [u.id, u]))
  const branchMap = new Map((branches ?? []).map((b) => [b.id, b]))
  const prizeMap = new Map((prizes ?? []).map((p) => [p.id, p]))

  const activities: ScanActivity[] = rows.map((r) => {
    const user = userMap.get(r.user_id)
    const verifier = userMap.get(r.verified_by_id)
    const branch = branchMap.get(r.branch_id)
    const prize = prizeMap.get(r.prize_id)
    return {
      id: r.id,
      type: r.type as 'checkin' | 'redemption',
      user_name: user?.email || `#${user?.unique_code || 'N/A'}`,
      user_unique_code: user?.unique_code || '',
      timestamp: r.timestamp || '',
      branch_name: branch?.name,
      prize_name: prize?.name,
      verified_by_name: verifier?.email || `#${verifier?.unique_code || 'N/A'}`,
    }
  })

  return { data: activities, total: count ?? 0 }
}

// Cache por página: cada (page, pageSize) tiene su propia entrada.
// Mismo tag que la actividad reciente — se invalida automáticamente después de cada escaneo.
const getCachedScanHistory = unstable_cache(
  (page: number, pageSize: number) => fetchScanHistoryPaginated(page, pageSize),
  ['scan-history-paginated'],
  { revalidate: 60, tags: [SCAN_ACTIVITY_TAG] }
)

export async function getScanHistoryPaginated(
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: ScanActivity[]; total: number }> {
  try {
    return await getCachedScanHistory(page, pageSize)
  } catch (error) {
    console.error('Error fetching scan history:', error)
    return { data: [], total: 0 }
  }
}
