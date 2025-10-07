/**
 * 📝 LOGIN PAGE
 * Página de inicio de sesión con nuevo diseño corporativo
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

import { AuthLayout } from '@/components/auth/AuthLayout'
import LoginForm from '@/components/auth/LoginForm'

// Componente interno que usa useSearchParams
function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const supabase = createClientBrowser()

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Mostrar mensaje si viene de registro
        const message = searchParams.get('message')
        if (message) {
          toast({
            title: "Información",
            description: message,
            variant: "default",
          })
        }

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
  }, [router, supabase, searchParams, toast])

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
      title="Iniciar Sesión"
      subtitle="Accede a tu cuenta para continuar"
    >
      <LoginForm />
    </AuthLayout>
  )
}

// Componente principal envuelto en Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}