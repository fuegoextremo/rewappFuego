'use client'

import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/client'
import { SystemSettings, DEFAULT_SETTINGS } from '@/constants/default-settings'

export { type SystemSettings }

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true)
        const supabase = createClientBrowser()
        
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value')
          .eq('is_active', true)

        if (error) {
          console.error('Error obteniendo configuraciones:', error)
          setSettings(DEFAULT_SETTINGS)
          return
        }

        // Convertir array de key-value a objeto
        const settingsObj = data.reduce((acc, { key, value }) => {
          acc[key as keyof SystemSettings] = value
          return acc
        }, {} as Partial<SystemSettings>)

        setSettings({ ...DEFAULT_SETTINGS, ...settingsObj })
      } catch (err) {
        setError('Error cargando configuraciones')
        console.error(err)
        setSettings(DEFAULT_SETTINGS)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  return { settings, loading, error }
}

// Ya no necesitamos getDefaultSettings() aquí porque usamos DEFAULT_SETTINGS
