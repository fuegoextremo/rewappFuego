'use client'

import { useQuery } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'
import { SystemSettings, DEFAULT_SETTINGS } from '@/constants/default-settings'

export { type SystemSettings }

// ✨ Función de fetching optimizada
async function fetchSystemSettings(): Promise<SystemSettings> {
  const supabase = createClientBrowser()
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('is_active', true)

  if (error) {
    console.error('Error obteniendo configuraciones:', error)
    return DEFAULT_SETTINGS
  }

  // Convertir array de key-value a objeto
  const settingsObj = data.reduce((acc, { key, value }) => {
    acc[key as keyof SystemSettings] = value
    return acc
  }, {} as Partial<SystemSettings>)

  return { ...DEFAULT_SETTINGS, ...settingsObj }
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system', 'settings'],
    queryFn: fetchSystemSettings,
    staleTime: 30 * 60 * 1000, // ✨ 30 minutos - cache agresivo para configuración
    gcTime: 60 * 60 * 1000,    // ✨ 1 hora en memoria
    refetchOnWindowFocus: false, // ✨ No refetch en focus (agresivo)
    refetchOnReconnect: false,   // ✨ No refetch al reconectar
    retry: 3,
    retryDelay: 1000,
    // ✨ Nunca fallar - siempre devolver DEFAULT_SETTINGS
    throwOnError: false,
  })
}

// Ya no necesitamos getDefaultSettings() aquí porque usamos DEFAULT_SETTINGS