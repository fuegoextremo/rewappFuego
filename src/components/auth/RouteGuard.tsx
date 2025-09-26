'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/client'

interface RouteGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
  fallbackComponent?: React.ReactNode
}

export function RouteGuard({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login',
  fallbackComponent = <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
  </div>
}: RouteGuardProps) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClientBrowser()

  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        // 1. Verificar autenticación
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError || !session?.user) {
          console.log('🚫 No hay sesión válida, redirigiendo a login')
          router.push(redirectTo)
          return
        }

        // 2. Si no se requieren roles específicos, permitir acceso
        if (allowedRoles.length === 0) {
          setAuthorized(true)
          setLoading(false)
          return
        }

        // 3. Obtener perfil completo del usuario desde la BD
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, first_name, last_name, phone, birth_date')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('❌ Error obteniendo perfil:', profileError)
          router.push(redirectTo)
          return
        }

        const role = profile?.role

        // 4. Verificar que el perfil esté completo (solo para clientes)
        const REQUIRED_FIELDS = ['first_name', 'last_name', 'phone', 'birth_date']
        const isProfileComplete = REQUIRED_FIELDS.every(field => {
          const value = profile?.[field as keyof typeof profile]
          return value !== null && value !== undefined && value !== ''
        })

        if (!isProfileComplete && role === 'client') {
          console.log('🚫 Perfil incompleto, redirigiendo a welcome')
          router.push('/welcome')
          return
        }

        // 5. Verificar permisos de rol
        if (!role || !allowedRoles.includes(role)) {
          console.log(`🚫 Rol '${role}' no autorizado. Roles permitidos:`, allowedRoles)
          
          // Redirigir según el rol del usuario
          const roleRedirects = {
            'client': '/client',
            'verifier': '/admin/dashboard',
            'manager': '/admin/dashboard',
            'admin': '/admin/dashboard',
            'superadmin': '/superadmin/dashboard'
          }
          
          const roleRedirect = roleRedirects[role as keyof typeof roleRedirects] || '/login'
          router.push(roleRedirect)
          return
        }

        // 6. Usuario autorizado
        console.log(`✅ Usuario autorizado con rol: ${role}`)
        setAuthorized(true)

      } catch (error) {
        console.error('❌ Error en verificación de seguridad:', error)
        router.push(redirectTo)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndRole()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (event === 'SIGNED_IN') {
        checkAuthAndRole()
      }
    })

    return () => subscription.unsubscribe()
  }, [router, redirectTo, allowedRoles, supabase])

  // Estados de carga y autorización
  if (loading) {
    return fallbackComponent
  }

  if (!authorized) {
    return null // Se está redirigiendo
  }

  return <>{children}</>
}
