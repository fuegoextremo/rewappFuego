'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { unstable_cache, revalidateTag } from "next/cache"

export type UserFilters = {
  search?: string
  role?: string
  branch?: string
  provider?: string
  page?: number
  pageSize?: number
}

export type UserWithDetails = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  provider?: string | undefined
  phone: string | null
  birth_date: string | null
  role: string | null
  branch_id: string | null
  unique_code: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  check_ins: { count: number }[]
  coupons: { count: number }[]
}

export type PaginatedUsersResponse = {
  users: UserWithDetails[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  error?: string
}

const USERS_TAG = 'users-list'

async function fetchUsersPaginated(filters: UserFilters): Promise<PaginatedUsersResponse> {
  const {
    search = '',
    role,
    branch,
    provider,
    page = 1,
    pageSize = 20,
  } = filters

  const supabase = createAdminClient()
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  let query = supabase
    .from('user_profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      provider,
      phone,
      birth_date,
      role,
      branch_id,
      unique_code,
      is_active,
      created_at,
      updated_at,
      check_ins!check_ins_user_id_fkey(count),
      coupons!coupons_user_id_fkey(count)
    `, { count: 'exact' })
    .neq('role', 'superadmin')

  if (search && search.trim()) {
    const searchTerm = search.trim()
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
    )
  }

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  if (branch && branch !== 'all') {
    query = query.eq('branch_id', branch)
  }

  if (provider && provider !== 'all') {
    query = query.eq('provider', provider)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0, page, pageSize, totalPages: 0, error: error.message }
  }

  const users: UserWithDetails[] = (data || []).map((user): UserWithDetails => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    provider: user.provider || 'email',
    phone: user.phone,
    birth_date: user.birth_date,
    role: user.role,
    branch_id: user.branch_id,
    unique_code: user.unique_code,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
    check_ins: Array.isArray(user.check_ins) && user.check_ins.length > 0
      ? user.check_ins
      : [{ count: 0 }],
    coupons: Array.isArray(user.coupons) && user.coupons.length > 0
      ? user.coupons
      : [{ count: 0 }],
  }))

  return {
    users,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

// Cache por combinación de filtros. Se invalida con revalidateTag después
// de cualquier mutación (cambio de rol, activación/desactivación, etc.).
const getCachedUsersPaginated = unstable_cache(
  (filters: UserFilters) => fetchUsersPaginated(filters),
  ['users-paginated'],
  { revalidate: 60, tags: [USERS_TAG] }
)

export async function getUsersPaginated(filters: UserFilters = {}): Promise<PaginatedUsersResponse> {
  try {
    return await getCachedUsersPaginated(filters)
  } catch (error) {
    console.error('Unexpected error in getUsersPaginated:', error)
    return {
      users: [],
      total: 0,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
      totalPages: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Invalidar todas las entradas cacheadas de usuarios.
// Llamar desde actions.ts después de cualquier mutación.
export async function invalidateUsersCache() {
  revalidateTag(USERS_TAG)
}
