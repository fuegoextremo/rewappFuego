/**
 * 🔍 COMPONENTE: ProfileValidator
 * Valida el perfil del usuario una sola vez al cargar la app
 * y redirige a complete-profile si faltan datos críticos
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/store/hooks'
import { createClientBrowser } from '@/lib/supabase/client'

export function ProfileValidator() {
  const user = useUser()
  const router = useRouter()
  const [hasValidated, setHasValidated] = useState(false)

  useEffect(() => {
    // Solo validar una vez cuando el usuario esté cargado y no hayamos validado antes
    if (!user || hasValidated) return

    const validateProfile = async () => {
      try {
        // Si ya tiene nombre y apellido en Redux, no necesitamos validar
        if (user.first_name && user.last_name) {
          setHasValidated(true)
          return
        }

        // Obtener datos completos del perfil desde la BD
        const supabase = createClientBrowser()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        // Si faltan datos críticos, redirigir a completar perfil
        if (!profile?.first_name || !profile?.last_name) {
          console.log('Perfil incompleto detectado, redirigiendo a complete-profile')
          router.push('/complete-profile')
          return
        }

        setHasValidated(true)
      } catch (error) {
        console.warn('Error validando perfil:', error)
        setHasValidated(true) // Marcar como validado para evitar loops
      }
    }

    validateProfile()
  }, [user, hasValidated, router])

  // Este componente no renderiza nada
  return null
}