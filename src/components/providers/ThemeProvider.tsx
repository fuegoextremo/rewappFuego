'use client'

import { useSystemSettings } from '@/hooks/use-system-settings'
import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSystemSettings()

  useEffect(() => {
    // Solo aplicar si no hay CSS crítico ya establecido
    const root = document.documentElement
    const currentPrimary = getComputedStyle(root).getPropertyValue('--primary')
    
    // Si ya hay un valor establecido (por CSS crítico), no hacer nada
    if (currentPrimary && currentPrimary.trim() !== '') {
      return
    }
    
    if (settings) {
      // Aplicar colores dinámicos a las variables CSS como fallback
      const primaryHSL = hexToHSL(settings.company_theme_primary)
      const secondaryHSL = hexToHSL(settings.company_theme_secondary)
      
      root.style.setProperty('--primary', primaryHSL)
      root.style.setProperty('--secondary', secondaryHSL)
      
      // Variantes automáticas
      root.style.setProperty('--primary-foreground', '0 0% 98%') // Texto blanco sobre primario
      root.style.setProperty('--secondary-foreground', '0 0% 9%') // Texto oscuro sobre secundario
    }
  }, [settings])

  return <>{children}</>
}

// Función auxiliar para convertir HEX a HSL
function hexToHSL(hex: string): string {
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
