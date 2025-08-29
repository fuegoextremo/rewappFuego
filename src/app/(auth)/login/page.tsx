'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { createClientBrowser } from '@/lib/supabase/client'

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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Usuario ya está logueado, obtener perfil y redirigir
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        const destination = getRoleDestination(profile?.role || 'client')
        router.replace(destination)
      }
    }

    checkUser()
  }, [router, supabase])

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