/**
 * 📄 PÁGINA: Complete Profile
 * Página para completar perfil después del login OAuth
 */

import { redirect } from 'next/navigation'
import { createClientServer } from '@/lib/supabase/server'
import { CompleteProfile } from '@/components/auth/CompleteProfile'

export default async function CompleteProfilePage() {
  const supabase = createClientServer()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Obtener datos actuales del perfil
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, phone, birth_date')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error loading profile for completion:', profileError)
    redirect('/login')
  }

  // Si ya tiene todos los datos críticos, redirigir a cliente
  if (profile.first_name && profile.last_name) {
    redirect('/client')
  }

  return (
    <CompleteProfile 
      userId={user.id}
      existingData={profile}
    />
  )
}