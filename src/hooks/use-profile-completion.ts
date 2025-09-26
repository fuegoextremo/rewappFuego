/**
 * 🔍 HOOK: useProfileCompletion
 * Hook para detectar si un perfil necesita ser completado después del login OAuth
 */

import { useMemo } from 'react'

interface UserProfile {
  first_name: string | null
  last_name: string | null
  phone: string | null
  birth_date: string | null
}

export function useProfileCompletion(profile: UserProfile | null) {
  return useMemo(() => {
    if (!profile) {
      return {
        needsCompletion: false,
        missingFields: [],
        missingFieldsCount: 0
      }
    }

    const missingFields = []
    
    // Campos considerados críticos para completar
    if (!profile.first_name?.trim()) {
      missingFields.push('first_name')
    }
    if (!profile.last_name?.trim()) {
      missingFields.push('last_name')
    }
    
    // Campos opcionales pero recomendados
    if (!profile.birth_date) {
      missingFields.push('birth_date')
    }
    if (!profile.phone?.trim()) {
      missingFields.push('phone')
    }

    return {
      needsCompletion: missingFields.length > 0,
      missingFields,
      missingFieldsCount: missingFields.length,
      // Solo campos críticos (nombre y apellido)
      needsCriticalCompletion: !profile.first_name?.trim() || !profile.last_name?.trim()
    }
  }, [profile])
}