/**
 * 🔍 CALLBACK UNIVERSAL OAUTH
 * Maneja todos los providers (Facebook, Google, etc.) con validación inteligente
 * Solo redirige a /welcome si faltan campos obligatorios
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 📋 Campos obligatorios - todos requeridos para usar la app
const REQUIRED_FIELDS = ['first_name', 'last_name', 'phone', 'birth_date'] as const

interface ProfileValidation {
  isComplete: boolean
  missingFields: string[]
  profile: {
    first_name: string | null
    last_name: string | null
    phone: string | null
    birth_date: string | null
  } | null
}

async function validateUserProfile(userId: string): Promise<ProfileValidation> {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, phone, birth_date')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Error fetching profile for validation:', error)
      // Si hay error, asumimos perfil incompleto por seguridad
      return {
        isComplete: false,
        missingFields: [...REQUIRED_FIELDS],
        profile: null
      }
    }

    // Verificar cada campo obligatorio
    const missingFields = REQUIRED_FIELDS.filter(field => {
      const value = profile[field]
      return !value || (typeof value === 'string' && !value.trim())
    })

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      profile
    }
  } catch (error) {
    console.error('Exception validating profile:', error)
    return {
      isComplete: false,
      missingFields: [...REQUIRED_FIELDS],
      profile: null
    }
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      // Intercambiar código por sesión
      const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

      if (authError || !user) {
        console.error('OAuth callback error:', authError)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }

      console.log('OAuth successful for user:', user.id)

      // VALIDACIÓN UNIVERSAL - todos los OAuth pasan por aquí
      const validation = await validateUserProfile(user.id)
      
      if (validation.isComplete) {
        console.log('✅ Profile complete, redirecting to /client')
        return NextResponse.redirect(`${requestUrl.origin}/client`)
      } else {
        console.log('🔧 Profile incomplete, missing:', validation.missingFields)
        return NextResponse.redirect(`${requestUrl.origin}/welcome`)
      }

    } catch (error) {
      console.error('Exception in OAuth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=callback_failed`)
    }
  }

  // Si no hay código, redirigir a login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}