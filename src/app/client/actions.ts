'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClientServer } from '@/lib/supabase/server'

/**
 * Desactiva la cuenta del usuario autenticado:
 * 1. Pone is_active = false en user_profiles (soft-delete)
 * 2. Banea al usuario en Supabase Auth para invalidar futuras sesiones
 *
 * El ban se puede revertir desde el panel de Supabase o desde superadmin
 * actualizando ban_duration a 'none'.
 */
export async function deactivateAccountAction() {
  const supabase = createClientServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  const adminClient = createAdminClient()

  // 1. Soft-delete en user_profiles
  const { error: profileError } = await adminClient
    .from('user_profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  // 2. Banear en Supabase Auth para bloquear login y refresco de tokens
  const { error: banError } = await adminClient.auth.admin.updateUserById(
    user.id,
    { ban_duration: '87600h' } // 10 años — reversible desde superadmin
  )

  if (banError) {
    // No es bloqueante: el middleware ya bloquea por is_active
    console.error('deactivateAccount ban error (non-blocking):', banError.message)
  }

  return { success: true }
}
