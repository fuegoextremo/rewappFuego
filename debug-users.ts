// Script para verificar los datos de usuarios en la base de datos
import { createAdminClient } from '@/lib/supabase/admin'

export async function debugUserData() {
  const supabase = createAdminClient()
  
  console.log('=== VERIFICANDO DATOS DE USUARIOS ===')
  
  // Ver todos los usuarios
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, unique_code, role')
    .limit(10)
  
  console.log('Usuarios en la base de datos:')
  console.log(users)
  console.log('Error:', error)
  
  // Ver check-ins recientes
  const { data: checkins, error: checkinsError } = await supabase
    .from('check_ins')
    .select('id, user_id, verified_by, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log('\nCheck-ins recientes:')
  console.log(checkins)
  console.log('Error:', checkinsError)
  
  // Ver redenciones recientes
  const { data: redemptions, error: redemptionsError } = await supabase
    .from('coupons')
    .select('id, user_id, redeemed_by, redeemed_at')
    .not('redeemed_at', 'is', null)
    .order('redeemed_at', { ascending: false })
    .limit(5)
  
  console.log('\nRedenciones recientes:')
  console.log(redemptions)
  console.log('Error:', redemptionsError)
}
