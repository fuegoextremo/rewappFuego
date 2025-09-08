'use client'

import { useState, useTransition, useEffect } from 'react'
import { useUser, useAppDispatch } from '@/store/hooks'
import { setUser } from '@/store/slices/authSlice'
import { useUpdateUserProfile } from '@/hooks/queries/useUserQueries'
import { useExtendedProfileData } from '@/hooks/use-extended-profile'
import { User, Phone, Calendar, Save, Loader2 } from 'lucide-react'

interface EditProfileFormProps {
  onSuccess?: () => void
}

export default function EditProfileForm({ onSuccess }: EditProfileFormProps) {
  const user = useUser()
  const dispatch = useAppDispatch()
  const updateProfile = useUpdateUserProfile()
  const extendedData = useExtendedProfileData(user?.id)
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    birth_date: ''
  })

  // Actualizar form cuando lleguen los datos extendidos
  useEffect(() => {
    if (extendedData.data?.birth_date) {
      setFormData(prev => ({
        ...prev,
        birth_date: extendedData.data.birth_date || ''
      }))
    }
  }, [extendedData.data])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validaciones básicas
    const newErrors: Record<string, string> = {}
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido'
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido'
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    startTransition(async () => {
      try {
        if (!user?.id) return

        const updates = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || null,
          birth_date: formData.birth_date || null
        }

        await updateProfile.mutateAsync({
          userId: user.id,
          updates
        })

        // Actualizar Redux store con los nuevos datos
        const updatedUser = {
          ...user,
          first_name: updates.first_name,
          last_name: updates.last_name,
          phone: updates.phone
        }
        dispatch(setUser(updatedUser))

        console.log('✅ Profile updated successfully')
        onSuccess?.()
      } catch (error) {
        console.error('❌ Error updating profile:', error)
        setErrors({ submit: 'Error al actualizar el perfil. Intenta de nuevo.' })
      }
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const isLoading = isPending || updateProfile.isPending

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Nombre */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <User className="w-4 h-4" />
          <span>Nombre</span>
        </label>
        <input
          type="text"
          value={formData.first_name}
          onChange={(e) => handleInputChange('first_name', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Tu nombre"
          disabled={isLoading}
        />
        {errors.first_name && (
          <p className="text-sm text-red-600">{errors.first_name}</p>
        )}
      </div>

      {/* Apellido */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <User className="w-4 h-4" />
          <span>Apellido</span>
        </label>
        <input
          type="text"
          value={formData.last_name}
          onChange={(e) => handleInputChange('last_name', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Tu apellido"
          disabled={isLoading}
        />
        {errors.last_name && (
          <p className="text-sm text-red-600">{errors.last_name}</p>
        )}
      </div>

      {/* Teléfono */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Phone className="w-4 h-4" />
          <span>Teléfono (opcional)</span>
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="+52 55 1234 5678"
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Fecha de nacimiento */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>Fecha de nacimiento (opcional)</span>
        </label>
        <input
          type="date"
          value={formData.birth_date}
          onChange={(e) => handleInputChange('birth_date', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={isLoading}
        />
      </div>

      {/* Error general */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Botón de guardar */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Guardando...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Guardar Cambios</span>
          </>
        )}
      </button>
    </form>
  )
}
