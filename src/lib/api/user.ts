import { createClientBrowser } from '@/lib/supabase/client'

const supabase = createClientBrowser()

// 🎯 FUNCIONES DE API PARA DATOS DE USUARIO

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      first_name,
      last_name,
      phone,
      role,
      birth_date,
      branch_id,
      unique_code,
      is_active,
      created_at,
      updated_at,
      branches:branch_id (
        id,
        name,
        address
      )
    `)
    .eq('id', userId)
    .single()

  if (error) {
    console.error('❌ Error fetching user profile:', error)
    throw new Error(`Error obteniendo perfil: ${error.message}`)
  }

  return data
}

export async function getUserCheckins(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('check_ins')
    .select(`
      id,
      user_id,
      branch_id,
      check_in_date,
      spins_earned,
      created_at,
      branches:branch_id (
        id,
        name,
        address
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('❌ Error fetching user checkins:', error)
    throw new Error(`Error obteniendo checkins: ${error.message}`)
  }

  return data || []
}

export async function getUserStats(userId: string) {
  // Obtener información básica del perfil
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, created_at')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('❌ Error fetching user stats:', profileError)
    throw new Error(`Error obteniendo estadísticas: ${profileError.message}`)
  }

  // Obtener streak actual
  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .select('current_count, max_count, last_check_in')
    .eq('user_id', userId)
    .single()

  if (streakError) {
    console.warn('⚠️ No streak found for user:', streakError)
  }

  // Obtener checkins del mes actual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const { data: monthCheckins, error: checkinsError } = await supabase
    .from('check_ins')
    .select('spins_earned')
    .eq('user_id', userId)
    .gte('check_in_date', startOfMonth.toISOString())

  if (checkinsError) {
    console.error('❌ Error fetching month checkins:', checkinsError)
  }

  // Contar total de checkins
  const { count: totalCheckins, error: countError } = await supabase
    .from('check_ins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    console.error('❌ Error counting checkins:', countError)
  }

  const monthlySpins = monthCheckins?.reduce((sum, checkin) => sum + (checkin.spins_earned || 0), 0) || 0

  return {
    firstName: profile.first_name,
    lastName: profile.last_name,
    memberSince: profile.created_at,
    currentStreak: streak?.current_count || 0,
    maxStreak: streak?.max_count || 0,
    lastCheckin: streak?.last_check_in,
    totalCheckins: totalCheckins || 0,
    monthlySpins,
    monthlyCheckins: monthCheckins?.length || 0
  }
}

export async function updateUserProfile(userId: string, updates: Partial<{
  first_name: string
  last_name: string
  phone: string | null
  birth_date: string | null
}>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating user profile:', error)
    throw new Error(`Error actualizando perfil: ${error.message}`)
  }

  return data
}

export async function deactivateUserAccount(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('❌ Error deactivating user account:', error)
    throw new Error(`Error desactivando cuenta: ${error.message}`)
  }

  return data
}
