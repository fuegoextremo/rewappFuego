import { createClientServer } from '@/lib/supabase/server'
import { SystemSettings, DEFAULT_SETTINGS } from '@/constants/default-settings'

export async function getSystemSettingsServer(): Promise<SystemSettings> {
  try {
    const supabase = createClientServer()
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('is_active', true)

    if (error) {
      console.error('Error obteniendo configuraciones del servidor:', error)
      return DEFAULT_SETTINGS
    }

    // Convertir array de key-value a objeto
    const settingsObj = data.reduce((acc: Partial<SystemSettings>, { key, value }: { key: string, value: string }) => {
      acc[key as keyof SystemSettings] = value
      return acc
    }, {} as Partial<SystemSettings>)

    return { ...DEFAULT_SETTINGS, ...settingsObj }
  } catch (err) {
    console.error('Error cargando configuraciones del servidor:', err)
    return DEFAULT_SETTINGS
  }
}

// Función auxiliar para convertir HEX a HSL (reutilizada del ThemeProvider)
export function hexToHSL(hex: string): string {
  // Remover # si existe
  hex = hex.replace('#', '')
  
  // Convertir a RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0 // Gris
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
      default: h = 0
    }
    h /= 6
  }

  // Convertir a formato HSL para CSS (0-360, 0-100%, 0-100%)
  const hDeg = Math.round(h * 360)
  const sPercent = Math.round(s * 100)
  const lPercent = Math.round(l * 100)
  
  return `${hDeg} ${sPercent}% ${lPercent}%`
}

// Generar CSS crítico con los colores del tema
export function generateCriticalCSS(settings: SystemSettings): string {
  const primaryHSL = hexToHSL(settings.company_theme_primary)
  const secondaryHSL = hexToHSL(settings.company_theme_secondary)
  
  return `
    :root {
      --primary: ${primaryHSL};
      --secondary: ${secondaryHSL};
      --primary-foreground: 0 0% 98%;
      --secondary-foreground: 0 0% 9%;
    }
  `.trim()
}
