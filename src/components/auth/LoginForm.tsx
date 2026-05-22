/**
 * 📝 LOGIN FORM COMPONENT
 * Formulario de login mejorado con diseño corporativo
 * Incluye OAuth, validaciones y branding dinámico
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuthBranding } from '@/hooks/use-auth-branding'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { SocialButton } from '@/components/auth/SocialButton'

import { createClientBrowser } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'

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

export default function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { primaryColor } = useAuthBranding()
  const { data: settings } = useSystemSettings()
  const showGoogle = settings?.enable_google_login === 'true'
  const showFacebook = settings?.enable_facebook_login === 'true'
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientBrowser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('No se pudo obtener información del usuario')
      }

      // Obtener perfil del usuario para determinar redirección
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.warn('Error obteniendo perfil:', profileError)
        // Si no puede obtener el perfil, asume que es cliente
        router.push('/client')
        return
      }

      // Redireccionar según el rol
      const destination = getRoleDestination(profile.role || 'client')
      router.push(destination)

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente.",
      })

    } catch (error) {
      console.error('Error en login:', error)
      
      let message = 'Error desconocido al iniciar sesión'
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          message = 'Email o contraseña incorrectos'
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Confirma tu email antes de iniciar sesión'
        } else {
          message = error.message
        }
      }

      toast({
        title: "Error al iniciar sesión",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {(showGoogle || showFacebook) && (
        <>
          <div className="space-y-3">
            {showGoogle && <SocialButton provider="google" disabled={isLoading} />}
            {showFacebook && <SocialButton provider="facebook" disabled={isLoading} />}
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>
        </>
      )}

      {/* Formulario de email/password */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Correo electrónico
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="mt-1 py-3 px-4 h-12 rounded-lg"
            placeholder="tu@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="mt-1 py-3 px-4 h-12 rounded-lg"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-6 font-medium text-white transition-colors rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>

      {/* Link de registro */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          ¿Aún no tienes cuenta?{' '}
          <Link
            href="/register"
            className="font-medium transition-colors"
            style={{ color: primaryColor }}
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}