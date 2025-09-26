/**
 * 📝 COMPONENTE: CompleteProfile
 * Flujo de completado de perfil para usuarios OAuth con datos faltantes
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createClientBrowser } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hooks'
import { loadUserProfile } from '@/store/slices/authSlice'

interface CompleteProfileProps {
  userId: string
  existingData: {
    first_name: string | null
    last_name: string | null
    phone: string | null
    birth_date: string | null
  }
}

export function CompleteProfile({ userId, existingData }: CompleteProfileProps) {
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: existingData.first_name || '',
    last_name: existingData.last_name || '',
    phone: existingData.phone || '',
    birth_date: existingData.birth_date || ''
  })

  // Determinar qué campos faltan
  const missingFields = {
    first_name: !existingData.first_name,
    last_name: !existingData.last_name,
    phone: !existingData.phone,
    birth_date: !existingData.birth_date
  }

  const hasMissingFields = Object.values(missingFields).some(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClientBrowser()
      
      // Actualizar solo los campos que faltan
      const updates: Record<string, string> = {}
      if (missingFields.first_name && formData.first_name) {
        updates.first_name = formData.first_name.trim()
      }
      if (missingFields.last_name && formData.last_name) {
        updates.last_name = formData.last_name.trim()
      }
      if (missingFields.phone && formData.phone) {
        updates.phone = formData.phone.trim()
      }
      if (missingFields.birth_date && formData.birth_date) {
        updates.birth_date = formData.birth_date
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      // Recargar perfil de usuario en Redux
      dispatch(loadUserProfile(userId))

      toast({
        title: "¡Perfil completado!",
        description: "Gracias por completar tu información."
      })

      // Continuar al área de cliente
      router.push('/client')
      
    } catch (error) {
      console.error('Error completing profile:', error)
      toast({
        title: "Error",
        description: "No se pudo completar el perfil. Intenta de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    // Permitir saltar el completado (opcional)
    router.push('/client')
  }

  // Si no hay campos faltantes, redirigir automáticamente
  if (!hasMissingFields) {
    router.push('/client')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>¡Bienvenido! 🎉</CardTitle>
          <p className="text-sm text-gray-600">
            Para mejorar tu experiencia, completa tu perfil
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {missingFields.first_name && (
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Tu nombre"
                  required
                />
              </div>
            )}

            {missingFields.last_name && (
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Tu apellido"
                  required
                />
              </div>
            )}

            {missingFields.phone && (
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            )}

            {missingFields.birth_date && (
              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                />
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Completando...' : 'Completar Perfil'}
              </Button>
              
              <Button 
                type="button" 
                variant="ghost"
                className="w-full text-sm"
                onClick={handleSkip}
              >
                Completar después
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}