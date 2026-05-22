/**
 * 🎉 WELCOME WIZARD
 * Página de bienvenida que reutiliza AuthLayout + ProfileForm
 * Diseño consistente con /register - un solo paso
 */

'use client'

import { useState, useEffect } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import ProfileForm from '@/components/client/ProfileForm'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/use-toast'

interface WelcomeWizardProps {
  currentProfile: {
    first_name: string | null
    last_name: string | null
    phone: string | null
    birth_date: string | null
  }
  missingFields: string[]
}

export function WelcomeWizard({ currentProfile, missingFields }: WelcomeWizardProps) {
  const [showMissingFieldsHint, setShowMissingFieldsHint] = useState(true)
  const { toast } = useToast()

  // Convertir profile para ProfileForm
  const profileFormDefaults = {
    first_name: currentProfile.first_name || '',
    last_name: currentProfile.last_name || '',
    phone: currentProfile.phone || '',
    birth_date: currentProfile.birth_date || ''
  }

  // Callback cuando se completa el perfil
  const handleProfileComplete = async () => {
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        const { data } = await supabase.rpc('grant_welcome_coupon', { p_user_id: user.id })
        if (data?.success === true) {
          toast({
            title: '¡Bienvenido!',
            description: 'Tienes un cupon esperandote.',
          })
        }
      } catch (err) {
        console.error('grant_welcome_coupon error (non-blocking):', err)
      }
    }
    window.location.href = '/client'
  }

  // Ocultar hint después de 8 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMissingFieldsHint(false)
    }, 8000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <AuthLayout 
      title="¡Bienvenido!"
      subtitle="Para brindarte la mejor experiencia, necesitamos completar algunos datos de tu perfil."
    >
      {/* Hint sobre campos faltantes - se desvanece automáticamente */}
      {showMissingFieldsHint && missingFields.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm text-orange-800">
            <strong>Completa los datos que falten para continuar:</strong>
          </div>
          <div className="mt-2 space-y-1">
            {missingFields.includes('first_name') && (
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                Tu nombre
              </div>
            )}
            {missingFields.includes('last_name') && (
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                Tu apellido
              </div>
            )}
            {missingFields.includes('phone') && (
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                Tu teléfono
              </div>
            )}
            {missingFields.includes('birth_date') && (
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                Tu fecha de nacimiento
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reutilizar ProfileForm existente con diseño consistente */}
      <ProfileForm 
        defaultValues={profileFormDefaults}
        onSuccess={handleProfileComplete}
      />
    </AuthLayout>
  )
}