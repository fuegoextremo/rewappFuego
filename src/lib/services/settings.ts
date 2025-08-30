// src/lib/services/settings.ts
import { createClientServer } from "@/lib/supabase/server"
import { createClientBrowser } from "@/lib/supabase/client"
import { SystemSettings, DEFAULT_SETTINGS } from "@/constants/default-settings"

export { type SystemSettings }

// Para uso en Server Components
export async function getSystemSettings(): Promise<SystemSettings> {
  const supabase = createClientServer()
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('is_active', true)

  if (error) {
    console.error('Error obteniendo configuraciones:', error)
    return DEFAULT_SETTINGS
  }

  // Convertir array de key-value a objeto
  const settings = data.reduce((acc, { key, value }) => {
    acc[key as keyof SystemSettings] = value
    return acc
  }, {} as Partial<SystemSettings>)

  return { ...DEFAULT_SETTINGS, ...settings }
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
    return DEFAULT_SETTINGS
  }

  const settings = data.reduce((acc, { key, value }) => {
    acc[key as keyof SystemSettings] = value
    return acc
  }, {} as Partial<SystemSettings>)

  return { ...DEFAULT_SETTINGS, ...settings }
}

// Ya no necesitamos getDefaultSettings() aquí porque usamos DEFAULT_SETTINGS
