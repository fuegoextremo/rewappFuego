/**
 * 📝 REGISTER PAGE
 * Página de registro con nuevo diseño corporativo
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/client'

import { AuthLayout } from '@/components/auth/AuthLayout'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const supabase = createClientBrowser()

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Usuario ya autenticado, redirigir según su rol
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          const destination = profile?.role === 'client' ? '/client' : 
                            profile?.role === 'superadmin' ? '/superadmin/dashboard' : 
                            '/admin/dashboard'
          
          router.push(destination)
          return
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkUser()
  }, [router, supabase])

  // Mostrar loading mientras verifica auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <AuthLayout 
      title="Crear Cuenta"
      subtitle="Únete a nosotros y comienza a ganar recompensas"
    >
      <RegisterForm />
    </AuthLayout>
  )
}
