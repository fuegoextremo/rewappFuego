import { createClientBrowser } from '@/lib/supabase/client'

const supabase = createClientBrowser()

// 🎯 FUNCIONES DE API PARA CUPONES

export async function getUserCoupons(userId: string) {
  const { data, error } = await supabase
    .from('coupons')
    .select(`
      id,
      user_id,
      prize_id,
      unique_code,
      is_redeemed,
      redeemed_at,
      expires_at,
      created_at,
      prizes:prize_id (
        id,
        name,
        description,
        type,
        value,
        is_active
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching user coupons:', error)
    throw new Error(`Error obteniendo cupones: ${error.message}`)
  }

  return data || []
}

export async function getAvailableCoupons(userId: string) {
  const { data, error } = await supabase
    .from('coupons')
    .select(`
      id,
      user_id,
      prize_id,
      unique_code,
      expires_at,
      created_at,
      prizes:prize_id (
        id,
        name,
        description,
        type,
        value,
        is_active
      )
    `)
    .eq('user_id', userId)
    .eq('is_redeemed', false)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching available coupons:', error)
    throw new Error(`Error obteniendo cupones disponibles: ${error.message}`)
  }

  return data || []
}

export async function getUsedCoupons(userId: string) {
  const { data, error } = await supabase
    .from('coupons')
    .select(`
      id,
      user_id,
      prize_id,
      unique_code,
      redeemed_at,
      created_at,
      prizes:prize_id (
        id,
        name,
        description,
        type,
        value
      )
    `)
    .eq('user_id', userId)
    .eq('is_redeemed', true)
    .order('redeemed_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching used coupons:', error)
    throw new Error(`Error obteniendo cupones usados: ${error.message}`)
  }

  return data || []
}

export async function useCoupon(couponId: string, userId: string) {
  // Verificar que el cupón pertenece al usuario y está disponible
  const { data: coupon, error: fetchError } = await supabase
    .from('coupons')
    .select('id, user_id, is_redeemed, expires_at')
    .eq('id', couponId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !coupon) {
    throw new Error('Cupón no encontrado o no autorizado')
  }

  if (coupon.is_redeemed) {
    throw new Error('Este cupón ya ha sido usado')
  }

  if (new Date(coupon.expires_at!) < new Date()) {
    throw new Error('Este cupón ha expirado')
  }

  // Marcar como usado
  const { data, error } = await supabase
    .from('coupons')
    .update({
      is_redeemed: true,
      redeemed_at: new Date().toISOString(),
      redeemed_by: userId
    })
    .eq('id', couponId)
    .select()
    .single()

  if (error) {
    console.error('❌ Error using coupon:', error)
    throw new Error(`Error al usar cupón: ${error.message}`)
  }

  return data
}
