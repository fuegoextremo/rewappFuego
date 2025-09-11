/**
 * 📝 REGISTER FORM COMPONENT
 * Formulario de registro con validación y branding dinámico
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClientBrowser } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuthBranding } from '@/hooks/use-auth-branding'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { SocialButton } from '@/components/auth/SocialButton'
import { 
  EyeIcon, 
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

export default function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { primaryColor } = useAuthBranding()
  const supabase = createClientBrowser()

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isValid }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  })

  const watchTerms = watch('acceptTerms')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone
          }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast({
            variant: "destructive",
            title: "Email ya registrado",
            description: "Este email ya está registrado. Intenta iniciar sesión.",
          })
          return
        }
        
        throw authError
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario')
      }

      // Esperar un momento para que el trigger cree el perfil
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 2. Actualizar el perfil existente con los datos adicionales
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          phone: data.phone,
          birth_date: data.birthDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Error actualizando perfil:', profileError)
        throw new Error('Error completando el perfil de usuario')
      }

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada. Te estamos redirigiendo...",
        variant: "default",
      })

      // Esperar un momento para mostrar el toast
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 3. Auto-login después del registro exitoso
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (loginError) {
        console.error('Error en auto-login:', loginError)
        // Si falla el auto-login, redirigir a login manual
        router.push('/login?message=' + encodeURIComponent('Cuenta creada. Por favor inicia sesión.'))
        return
      }

      // 4. Obtener rol del usuario para redirección
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', loginData.user.id)
        .single()

      // 5. Redirigir según el rol
      const destination = profile?.role === 'client' ? '/client' : 
                        profile?.role === 'superadmin' ? '/superadmin/dashboard' : 
                        '/admin/dashboard'
      
      router.push(destination)

    } catch (error: unknown) {
      console.error('Error en registro:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intenta nuevamente.'
      
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
        {/* OAuth Buttons */}
        <div className="space-y-3">
          <SocialButton 
            provider="google" 
            disabled={true}
            className="w-full"
          />
          
          <SocialButton 
            provider="facebook" 
            disabled={true}
            className="w-full"
          />
        </div>      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">O registrarse con email</span>
        </div>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombres - Una columna */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              Nombre *
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="firstName"
                type="text"
                placeholder="Tu nombre"
                className={`pl-12 h-12 rounded-lg ${errors.firstName ? 'border-red-500' : ''}`}
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              Apellido *
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="lastName"
                type="text"
                placeholder="Tu apellido"
                className={`pl-12 h-12 rounded-lg ${errors.lastName ? 'border-red-500' : ''}`}
                {...register('lastName')}
              />
            </div>
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email *
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className={`pl-12 h-12 rounded-lg ${errors.email ? 'border-red-500' : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Teléfono con código de país */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Teléfono *
          </Label>
          <Controller
            name="phone"
            control={control}
            render={({ field: { onChange, value } }) => (
              <PhoneInput
                placeholder="Ingresa tu número de teléfono (10 dígitos)"
                value={value}
                onChange={onChange}
                defaultCountry="MX"
                countries={['MX', 'US', 'CA', 'ES', 'AR', 'CL', 'CO', 'PE']}
                addInternationalOption={false}
                className={`phone-input ${errors.phone ? 'phone-input-error' : ''}`}
                numberInputProps={{
                  className: `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                    ${errors.phone ? 'border-red-500' : ''}`,
                }}
              />
            )}
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Fecha de nacimiento */}
        <div className="space-y-2">
          <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700">
            Fecha de nacimiento *
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="birthDate"
              type="date"
              className={`pl-12 h-12 rounded-lg ${errors.birthDate ? 'border-red-500' : ''}`}
              {...register('birthDate')}
            />
          </div>
          {errors.birthDate && (
            <p className="text-sm text-red-600">{errors.birthDate.message}</p>
          )}
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Contraseña *
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`pl-12 pr-12 h-12 rounded-lg ${errors.password ? 'border-red-500' : ''}`}
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
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirmar contraseña *
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`pl-12 pr-12 h-12 rounded-lg ${errors.confirmPassword ? 'border-red-500' : ''}`}
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
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Términos y condiciones */}
        <div className="flex items-start space-x-2">
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Checkbox
                id="acceptTerms"
                checked={value}
                onCheckedChange={onChange}
                className="mt-1"
              />
            )}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acceptTerms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Acepto los{' '}
              <a 
                href="/legal/terms" 
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                términos y condiciones
              </a>
              {' '}y la{' '}
              <a 
                href="/legal/privacy" 
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                política de privacidad
              </a>
            </Label>
          </div>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full py-6 font-medium rounded-xl"
          disabled={isLoading || !isValid || !watchTerms}
          style={{
            backgroundColor: primaryColor,
            borderColor: primaryColor,
          }}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creando cuenta...</span>
            </div>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-medium hover:underline"
            style={{ color: primaryColor }}
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  )
}
