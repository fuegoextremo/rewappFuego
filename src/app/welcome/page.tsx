/**
 * 🎉 PÁGINA WELCOME
 * Wizard de bienvenida para usuarios con perfil incompleto
 * Solo llegan aquí usuarios que necesitan completar datos obligatorios
 */

import { redirect } from 'next/navigation'
import { createClientServer } from '@/lib/supabase/server'
import { WelcomeWizard } from '@/components/auth/WelcomeWizard'

// Campos obligatorios (misma configuración que callback)
const REQUIRED_FIELDS = ['first_name', 'last_name', 'phone', 'birth_date'] as const

export default async function WelcomePage() {
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
    console.error('Error loading profile for welcome:', profileError)
    redirect('/login')
  }

  // Verificar qué campos faltan
  const missingFields = REQUIRED_FIELDS.filter(field => {
    const value = profile[field]
    return !value || (typeof value === 'string' && !value.trim())
  })

  // Si ya tiene todos los datos, ir directamente a cliente
  // (esto es una protección adicional por si llegan aquí por error)
  if (missingFields.length === 0) {
    redirect('/client')
  }

  return (
    <WelcomeWizard 
      currentProfile={profile}
      missingFields={missingFields}
    />
  )
}