'use client'

import { useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientBrowser()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Obtener el perfil del usuario para determinar la redirección
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, first_name')
        .eq('id', data.user.id)
        .single()

      const destination = getRoleDestination(profile?.role || 'client')
      const userName = profile?.first_name || 'Usuario'

      // Mostrar toast de éxito
      toast({
        title: `¡Bienvenido ${userName}!`,
        description: "Acceso exitoso, redirigiendo a tu panel...",
        duration: 2000,
      })

      // Esperar un poco para que el usuario vea el toast antes de redirigir
      setTimeout(() => {
        router.push(destination)
        router.refresh()
      }, 1500)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      setError(errorMessage)
      toast({
        title: "Error al iniciar sesión",
        description: errorMessage || 'Verifica tus credenciales e intenta nuevamente',
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    </form>
  )
}