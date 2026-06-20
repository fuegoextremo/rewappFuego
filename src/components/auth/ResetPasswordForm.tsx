/**
 * 🔐 RESET PASSWORD FORM  
 * Formulario para establecer nueva contraseña con token
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuthBranding } from '@/hooks/use-auth-branding'
import { createClientBrowser } from '@/lib/supabase/client'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

// Validación del formulario
const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)
  const [isVerifying, setIsVerifying] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { primaryColor } = useAuthBranding()
  const supabase = createClientBrowser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    let cancelled = false

    const establishSession = async () => {
      // 1. Error explícito en la URL (link expirado/inválido)
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        if (!cancelled) {
          setIsValidToken(false)
          setIsVerifying(false)
          toast({
            title: "Enlace inválido",
            description: errorDescription || "El enlace de recuperación no es válido o ha expirado.",
            variant: "destructive",
          })
        }
        return
      }

      // 2. Flujo PKCE: intercambiar el code por una sesión.
      // Sin esto, updateUser() falla con "Auth session missing!".
      const code = searchParams.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return

        if (exchangeError) {
          setIsValidToken(false)
          setIsVerifying(false)
          toast({
            title: "Enlace inválido",
            description: "El enlace de recuperación no es válido o ha expirado.",
            variant: "destructive",
          })
          return
        }

        setIsVerifying(false)
        return
      }

      // 3. Sin code: puede ser flujo implícito (#access_token en el hash,
      // auto-detectado por el cliente) o un enlace ya consumido. Verificamos
      // que exista una sesión antes de habilitar el formulario.
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session) {
        setIsValidToken(false)
        toast({
          title: "Enlace inválido",
          description: "El enlace de recuperación no es válido o ha expirado.",
          variant: "destructive",
        })
      }
      setIsVerifying(false)
    }

    establishSession()

    return () => {
      cancelled = true
    }
  }, [searchParams, toast, supabase])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: data.password 
      })

      if (error) {
        throw error
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente.",
        variant: "default",
      })

      // Redirigir al login después de un momento
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      console.error('Error en reset password:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la contraseña.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Mientras se establece la sesión a partir del enlace
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Si el token no es válido, mostrar mensaje de error
  if (!isValidToken) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Enlace inválido
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              El enlace de recuperación no es válido o ha expirado.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/forgot-password">
            <Button 
              className="w-full py-6 font-medium text-white transition-colors rounded-xl"
              style={{ backgroundColor: primaryColor }}
            >
              Solicitar nuevo enlace
            </Button>
          </Link>
          
          <Link 
            href="/login"
            className="block text-sm text-center"
            style={{ color: primaryColor }}
          >
            Regresar al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nueva Contraseña */}
        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Nueva contraseña *
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`pr-12 h-12 rounded-lg ${errors.password ? 'border-red-500' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirmar Contraseña */}
        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirmar nueva contraseña *
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`pr-12 h-12 rounded-lg ${errors.confirmPassword ? 'border-red-500' : ''}`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-6 font-medium text-white transition-colors rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
        </Button>
      </form>

      {/* Back to login */}
      <div className="text-center">
        <Link
          href="/login"
          className="text-sm transition-colors"
          style={{ color: primaryColor }}
        >
          ← Regresar al login
        </Link>
      </div>
    </div>
  )
}
