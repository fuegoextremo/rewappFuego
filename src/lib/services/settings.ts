// src/lib/services/settings.ts
import { createClientServer } from "@/lib/supabase/server"
import { createClientBrowser } from "@/lib/supabase/client"

export type SystemSettings = {
  company_name: string
  company_logo_url: string
  company_theme_primary: string
  company_theme_secondary: string
  company_contact_email: string
  company_contact_phone: string
  company_address: string
  company_terms_conditions: string
  company_privacy_policy: string
  streak_initial_image?: string
  streak_progress_default?: string
  streak_complete_image?: string
}

// Para uso en Server Components
export async function getSystemSettings(): Promise<SystemSettings> {
  const supabase = createClientServer()
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('is_active', true)

  if (error) {
    console.error('Error obteniendo configuraciones:', error)
    return getDefaultSettings()
  }

  // Convertir array de key-value a objeto
  const settings = data.reduce((acc, { key, value }) => {
    acc[key as keyof SystemSettings] = value
    return acc
  }, {} as Partial<SystemSettings>)

  return { ...getDefaultSettings(), ...settings }
}

// Para uso en Client Components
export async function getSystemSettingsClient(): Promise<SystemSettings> {
  const supabase = createClientBrowser()
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('is_active', true)

  if (error) {
    console.error('Error obteniendo configuraciones:', error)
    return getDefaultSettings()
  }

  const settings = data.reduce((acc, { key, value }) => {
    acc[key as keyof SystemSettings] = value
    return acc
  }, {} as Partial<SystemSettings>)

  return { ...getDefaultSettings(), ...settings }
}

// Configuraciones por defecto (fallbacks)
function getDefaultSettings(): SystemSettings {
  return {
    company_name: 'Fuego Rewards',
    company_logo_url: '',
    company_theme_primary: '#D73527', // Rojo del diseño
    company_theme_secondary: '#F97316', // Naranja complementario
    company_contact_email: '',
    company_contact_phone: '',
    company_address: '',
    company_terms_conditions: 'Términos y condiciones por definir...',
    company_privacy_policy: 'Política de privacidad por definir...',
    streak_initial_image: '/images/streak-start-default.svg',
    streak_progress_default: '/images/streak-progress-default.svg',
    streak_complete_image: '/images/streak-complete-default.svg'
  }
}
