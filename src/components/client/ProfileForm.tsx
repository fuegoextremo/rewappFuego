// src/components/client/ProfileForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { profileSchema } from '@/lib/utils/validation'
import { createClientBrowser } from '@/lib/supabase/client'
import { useAuthBranding } from '@/hooks/use-auth-branding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  UserIcon, 
  PhoneIcon, 
  CalendarDaysIcon 
} from '@heroicons/react/24/outline'

type Props = {
  defaultValues: {
    first_name: string
    last_name: string
    phone: string
    birth_date: string // YYYY-MM-DD
  }
  onSuccess?: () => void  // Callback opcional para cuando se completa exitosamente
}

export default function ProfileForm({ defaultValues, onSuccess }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const router = useRouter()
  const { primaryColor } = useAuthBranding()
  
  // Estado local para los campos del formulario
  const [formData, setFormData] = useState({
    first_name: defaultValues.first_name || '',
    last_name: defaultValues.last_name || '',
    phone: defaultValues.phone || '',
    birth_date: defaultValues.birth_date || ''
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    startTransition(async () => {
      setError(null)
      setOk(false)

      const data = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        birth_date: formData.birth_date,
      }

      const parsed = profileSchema.safeParse(data)
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? 'Datos inválidos')
        return
      }

      // Normaliza: strings vacías -> null (especialmente birth_date que es DATE en DB)
      const payload = {
        first_name: parsed.data.first_name?.trim() ? parsed.data.first_name.trim() : null,
        last_name: parsed.data.last_name?.trim() ? parsed.data.last_name.trim() : null,
        phone: parsed.data.phone?.trim() ? parsed.data.phone.trim() : null,
        birth_date: parsed.data.birth_date?.trim() ? parsed.data.birth_date : null,
      }

      const supabase = createClientBrowser()
      const {
        data: { user },
        error: uerr,
      } = await supabase.auth.getUser()
      if (uerr || !user) {
        setError('Sesión expirada. Vuelve a iniciar sesión.')
        return
      }

      const { error: upErr } = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('id', user.id)

      if (upErr) {
        setError('No se pudo actualizar tu perfil.')
        return
      }

      setOk(true)
      
      // Si hay callback de éxito personalizado, ejecutarlo (para wizard)
      // Si no, hacer refresh normal (para edición de perfil)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1000) // Mostrar "Guardado ✅" por 1 segundo antes del callback
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
          Nombre *
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="first_name"
            type="text"
            placeholder="Tu nombre"
            className="pl-12 h-12 rounded-lg"
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({...prev, first_name: e.target.value}))}
          />
        </div>
      </div>

      {/* Apellido */}
      <div className="space-y-2">
        <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
          Apellido *
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="last_name"
            type="text"
            placeholder="Tu apellido"
            className="pl-12 h-12 rounded-lg"
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({...prev, last_name: e.target.value}))}
          />
        </div>
      </div>

      {/* Teléfono */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
          Teléfono *
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <PhoneIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="phone"
            type="tel"
            placeholder="Tu número de teléfono"
            className="pl-12 h-12 rounded-lg"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
          />
        </div>
      </div>

      {/* Fecha de nacimiento */}
      <div className="space-y-2">
        <Label htmlFor="birth_date" className="text-sm font-medium text-gray-700">
          Fecha de nacimiento *
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="birth_date"
            type="date"
            className="pl-12 h-12 rounded-lg"
            value={formData.birth_date}
            onChange={(e) => setFormData(prev => ({...prev, birth_date: e.target.value}))}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full py-6 font-medium rounded-xl"
        disabled={pending}
        style={{
          backgroundColor: primaryColor,
          borderColor: primaryColor,
        }}
      >
        {pending ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Guardando...</span>
          </div>
        ) : (
          'Completar perfil'
        )}
      </Button>

      {/* Success message */}
      {ok && (
        <div className="text-center">
          <p className="text-sm text-green-600">¡Perfil completado exitosamente! ✅</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  )
}