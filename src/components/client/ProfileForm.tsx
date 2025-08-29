// src/components/client/ProfileForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { profileSchema } from '@/lib/utils/validation'
import { createClientBrowser } from '@/lib/supabase/client'

type Props = {
  defaultValues: {
    first_name: string
    last_name: string
    phone: string
    birth_date: string // YYYY-MM-DD
  }
}

export default function ProfileForm({ defaultValues }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const router = useRouter()
  
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
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="first_name">Nombre</label>
        <input 
          id="first_name" 
          name="first_name" 
          value={formData.first_name}
          onChange={(e) => setFormData(prev => ({...prev, first_name: e.target.value}))}
          className="w-full rounded-lg border px-3 py-2" 
          placeholder="Tu nombre" 
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="last_name">Apellidos</label>
        <input 
          id="last_name" 
          name="last_name" 
          value={formData.last_name}
          onChange={(e) => setFormData(prev => ({...prev, last_name: e.target.value}))}
          className="w-full rounded-lg border px-3 py-2" 
          placeholder="Tus apellidos" 
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="phone">Teléfono</label>
        <input 
          id="phone" 
          name="phone" 
          inputMode="tel" 
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
          className="w-full rounded-lg border px-3 py-2" 
          placeholder="10 dígitos" 
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="birth_date">Fecha de nacimiento</label>
        <input 
          id="birth_date" 
          name="birth_date" 
          type="date" 
          value={formData.birth_date}
          onChange={(e) => setFormData(prev => ({...prev, birth_date: e.target.value}))}
          className="w-full rounded-lg border px-3 py-2" 
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending}
                className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60">
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {ok && <span className="text-sm text-green-600">Guardado ✅</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}