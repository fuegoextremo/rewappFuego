'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { createClientBrowser } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

// Función para obtener el destino según el rol
function getRoleDestination(role: string): string {
  switch (role) {
    case 'client': return '/client'
    case 'verifier':
    case 'manager': 
    case 'admin': return '/admin/dashboard'
    case 'superadmin': return '/superadmin/dashboard'
    default: return '/client'
  }
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientBrowser()
  const { toast } = useToast()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setIsRedirecting(true)
        
        // Mostrar toast de redirección
        toast({
          title: "Sesión activa detectada",
          description: "Redirigiendo a tu panel...",
          duration: 2000,
        })
        
        // Usuario ya está logueado, obtener perfil y redirigir
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        const destination = getRoleDestination(profile?.role || 'client')
        
        // Esperar un poco para que el usuario vea el toast
        setTimeout(() => {
          router.replace(destination)
        }, 1500)
      }
    }

    checkUser()
  }, [router, supabase, toast])

  // Mostrar loading durante la redirección
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Redirigiendo...
          </h2>
          <p className="text-gray-600">
            Sesión activa detectada, te llevamos a tu panel
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Accede a tu cuenta de REWAPP
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}