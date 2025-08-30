'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const supabase = createClientBrowser()
  const { toast } = useToast()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      const justLoggedOut = searchParams.get('logout') === 'true'
      
      if (justLoggedOut) {
        console.log('🔥 Processing logout cleanup...')
        
        // Limpieza completa del cliente
        await supabase.auth.signOut({ scope: 'global' })
        
        // Limpiar storage
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        
        setIsCheckingAuth(false)
        
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente",
          duration: 3000,
        })
        
        // Limpiar URL después de mostrar el mensaje
        setTimeout(() => {
          router.replace('/login', { scroll: false })
        }, 1000)
        
        return
      }

      // Solo verificar sesión si no estamos procesando logout
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('🔍 Valid session found, redirecting...')
        setIsRedirecting(true)
        
        toast({
          title: "Sesión activa detectada",
          description: "Redirigiendo a tu panel...",
          duration: 2000,
        })
        
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          const destination = getRoleDestination(profile?.role || 'client')
          
          setTimeout(() => {
            router.replace(destination)
          }, 1500)
        } catch (error) {
          console.error('Error fetching profile:', error)
          // Si hay error con el perfil, forzar logout
          await supabase.auth.signOut()
          setIsRedirecting(false)
          setIsCheckingAuth(false)
        }
      } else {
        console.log('✅ No session found, showing login')
        setIsCheckingAuth(false)
      }
    }

    handleAuth()
  }, [router, supabase, toast, searchParams])

  // Función de emergencia para forzar logout completo
  const forceLogout = async () => {
    console.log('🚨 Emergency logout triggered')
    
    // Limpieza agresiva
    await supabase.auth.signOut({ scope: 'global' })
    await supabase.auth.signOut()
    
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      // Limpiar todas las cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      })
    }
    
    setIsRedirecting(false)
    setIsCheckingAuth(false)
    
    toast({
      title: "Sesión forzada a cerrar",
      description: "Todas las sesiones han sido limpiadas",
      duration: 3000,
    })
    
    router.replace('/login')
  }

  // Mostrar loading durante la verificación inicial o redirección
  if (isCheckingAuth || isRedirecting) {
    const message = isRedirecting 
      ? "Sesión activa detectada, te llevamos a tu panel"
      : "Verificando autenticación..."
      
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isRedirecting ? "Redirigiendo..." : "Cargando..."}
          </h2>
          <p className="text-gray-600 mb-4">
            {message}
          </p>
          
          {/* Botón de emergencia si está redirigiendo por mucho tiempo */}
          {isRedirecting && (
            <button
              onClick={forceLogout}
              className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              ¿Problemas? Forzar logout completo
            </button>
          )}
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