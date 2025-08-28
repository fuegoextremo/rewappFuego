// src/components/client/ChangePasswordForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { passwordChangeSchema } from '@/lib/utils/validation'
import { createClientBrowser } from '@/lib/supabase/client'

export default function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    setError(null)
    setOk(false)
    setLoading(true)

    const values = {
      current_password: String(formData.get('current_password') ?? ''),
      new_password: String(formData.get('new_password') ?? ''),
      confirm_password: String(formData.get('confirm_password') ?? ''),
    }

    const parsed = passwordChangeSchema.safeParse(values)
    if (!parsed.success) {
      setLoading(false)
      setError(parsed.error.errors[0]?.message ?? 'Datos inválidos')
      return
    }

    const supabase = createClientBrowser()
    const {
      data: { user },
      error: uerr,
    } = await supabase.auth.getUser()

    if (uerr || !user || !user.email) {
      setLoading(false)
      setError('Sesión expirada. Vuelve a iniciar sesión.')
      return
    }

    // 1) Verificar contraseña actual re-autenticando
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.current_password,
    })
    if (signErr) {
      setLoading(false)
      setError('Tu contraseña actual no es correcta.')
      return
    }

    // 2) Actualizar contraseña
    const { error: updErr } = await supabase.auth.updateUser({
      password: parsed.data.new_password,
    })
    if (updErr) {
      setLoading(false)
      setError('No se pudo actualizar la contraseña.')
      return
    }

    setOk(true)
    setLoading(false)
    // Opcional: router.refresh() o mostrar mensaje
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="current_password">Contraseña actual</label>
        <input id="current_password" name="current_password" type="password"
               className="w-full rounded-lg border px-3 py-2" />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="new_password">Nueva contraseña</label>
        <input id="new_password" name="new_password" type="password"
               className="w-full rounded-lg border px-3 py-2" />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="confirm_password">Confirmar nueva contraseña</label>
        <input id="confirm_password" name="confirm_password" type="password"
               className="w-full rounded-lg border px-3 py-2" />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading}
                className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60">
          {loading ? 'Actualizando…' : 'Cambiar contraseña'}
        </button>
        {ok && <span className="text-sm text-green-600">Hecho ✅</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}