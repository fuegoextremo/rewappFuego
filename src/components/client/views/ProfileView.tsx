'use client'

import { useState } from 'react'
import { useUser, useSettings, useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { UserCircle, Edit, Lock, LogOut, AlertTriangle, Phone, Cake } from 'lucide-react'
import ChangePasswordForm from '@/components/client/ChangePasswordForm'
import EditProfileForm from '@/components/client/EditProfileForm'
import BottomSheet from '@/components/ui/BottomSheet'
import { useRouter } from 'next/navigation'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { useDeactivateAccount } from '@/hooks/queries/useUserQueries'
import { useExtendedProfileData } from '@/hooks/use-extended-profile'
import Image from 'next/image'
import { motion } from 'framer-motion'

type BottomSheetType = 'edit' | 'password' | 'delete' | null

export default function ProfileView() {
  const user = useUser()
  const settings = useSettings()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const systemSettings = useSystemSettings()
  const extendedData = useExtendedProfileData(user?.id)
  const deactivateAccount = useDeactivateAccount()
  const [activeSheet, setActiveSheet] = useState<BottomSheetType>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Obtener color primario con fallback
  const primaryColor = systemSettings.data?.company_theme_primary || '#D73527'

  // Formatear fechas
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    try {
      // Parsear la fecha como local para evitar problemas de zona horaria
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month - 1 porque los meses van de 0-11
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return null
    }
  }

  const formatJoinYear = (dateString: string | null) => {
    if (!dateString) return '2024'
    try {
      // Para la fecha de registro, usamos el año directo desde el timestamp
      return new Date(dateString).getFullYear().toString()
    } catch {
      return '2024'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4 antialiased" style={{ shapeRendering: 'geometricPrecision' }} />
          <p className="text-gray-500 text-lg">Inicia sesión para ver tu perfil</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      // 🔥 Usar Redux logout que limpia localStorage automáticamente
      await dispatch(logout()).unwrap()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return
    
    try {
      await deactivateAccount.mutateAsync(user.id)
      
      // 🔥 Usar Redux logout después del soft delete
      await dispatch(logout()).unwrap()
      router.push('/login')
    } catch (error) {
      console.error('Error al eliminar cuenta:', error)
      alert('Error al eliminar la cuenta. Intenta de nuevo.')
    }
  }

  const handleEditSuccess = () => {
    setActiveSheet(null)
    // Opcionalmente mostrar un toast de éxito
  }

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header con Avatar - 40% de la pantalla */}
      <motion.div 
        className="bg-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="max-w-md mx-auto px-6 py-12 text-center">
          {/* Avatar circular grande */}
          <div className="relative inline-block mb-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          
          {/* Info del usuario */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-gray-600">
              {user.email}
            </p>
            {user.phone && (
              <p className="text-gray-600 flex items-center justify-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500 antialiased" style={{ shapeRendering: 'geometricPrecision' }} /> {user.phone}
              </p>
            )}
            {extendedData.data?.birth_date && (
              <p className="text-gray-600 flex items-center justify-center">
                <Cake className="w-4 h-4 mr-2 text-gray-500 antialiased" style={{ shapeRendering: 'geometricPrecision' }} /> {formatDate(extendedData.data.birth_date)}
              </p>
            )}
            <p className="text-sm text-gray-500">
              {user.role === 'client' ? 'Cliente' : user.role || 'Usuario'} desde {formatJoinYear(extendedData.data?.created_at || null)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content dividido en bloques como CouponsView */}
      <div className="max-w-md mx-auto px-4 space-y-6">

        {/* Botón principal de edición */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setActiveSheet('edit')}
            className="w-full flex items-center justify-center space-x-3 text-white py-4 px-6 rounded-xl hover:opacity-90 transition-all shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Edit className="w-5 h-5 antialiased" style={{ shapeRendering: 'geometricPrecision' }} />
            <span className="font-semibold">Editar mi perfil</span>
          </button>
        </motion.div>

        {/* Lista de acciones */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setActiveSheet('password')}
            className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600 antialiased" style={{ shapeRendering: 'geometricPrecision' }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Cambiar contraseña</p>
              <p className="text-sm text-gray-500">Actualiza tu contraseña de acceso</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <LogOut className="w-5 h-5 text-gray-600 antialiased" style={{ shapeRendering: 'geometricPrecision' }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Cerrar sesión</p>
              <p className="text-sm text-gray-500">Salir de tu cuenta</p>
            </div>
          </button>
        </motion.div>

        {/* Área peligrosa */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => setActiveSheet('delete')}
            className="w-full flex items-center space-x-4 p-4 hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 antialiased" style={{ shapeRendering: 'geometricPrecision' }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-900">Eliminar cuenta</p>
              <p className="text-sm text-red-600">Desactivar permanentemente tu cuenta</p>
            </div>
          </button>
        </motion.div>

        {/* Logo del establecimiento - SIN animación como solicitaste */}
        {settings?.company_logo_url && (
          <div className="text-center py-6">
            <div className="w-60 h-60 mx-auto rounded-3xl overflow-hidden flex items-center justify-center p-2">
              <Image 
                src={settings.company_logo_url} 
                alt={settings.company_name || 'Logo de la empresa'} 
                width={160}
                height={160}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </div>
        )}

        {/* Banner inferior - Sin padding para pegarlo al bottom nav */}
        <div className="w-full">
          <Image 
            src="/images/banner_inferior.png"
            alt="Banner inferior"
            width={400}
            height={200}
            className="w-full h-auto object-cover"
            priority={false}
          />
        </div>
      </div>

      {/* Bottom Sheets */}
      <BottomSheet
        isOpen={activeSheet === 'edit'}
        onClose={() => setActiveSheet(null)}
        title="Editar mi perfil"
      >
        <EditProfileForm onSuccess={handleEditSuccess} />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'password'}
        onClose={() => setActiveSheet(null)}
        title="Cambiar contraseña"
      >
        <div className="p-6">
          <ChangePasswordForm />
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'delete'}
        onClose={() => setActiveSheet(null)}
        title="Eliminar cuenta"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 antialiased" style={{ shapeRendering: 'geometricPrecision' }} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Confirmar eliminación</h3>
              <p className="text-red-700 text-sm mb-4">
                Esta acción marcará tu cuenta como inactiva. Podrás reactivarla contactando al soporte.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Escribe ELIMINAR"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'ELIMINAR' || deactivateAccount.isPending}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deactivateAccount.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveSheet(null)
                      setDeleteConfirmText('')
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </motion.div>
  )
}
