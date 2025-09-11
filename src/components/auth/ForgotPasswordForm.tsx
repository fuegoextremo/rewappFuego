/**
 * 🔐 FORGOT PASSWORD FORM
 * Formulario para solicitar recuperación de contraseña
 */

'use client'

import { useState } from 'react'
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

// Validación del formulario
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Ingresa un email válido')
    .min(1, 'El email es requerido')
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast()
  const { primaryColor } = useAuthBranding()
  const supabase = createClientBrowser()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      toast({
        title: "Email enviado",
        description: "Revisa tu bandeja de entrada para recuperar tu contraseña.",
        variant: "default",
      })

    } catch (error) {
      console.error('Error en forgot password:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar el email de recuperación.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Email enviado
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Hemos enviado un enlace de recuperación a:
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">
              {getValues('email')}
            </p>
            <p className="text-xs text-gray-500">
              Revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu contraseña.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            className="w-full"
          >
            Enviar a otro email
          </Button>
          
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

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-6 font-medium text-white transition-colors rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
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
