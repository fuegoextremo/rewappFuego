import { useEffect } from 'react'
import { useUser, useSettings, useAppDispatch } from '@/store/hooks'
import { setCurrentView } from '@/store/slices/uiSlice'
import { StreakSectionWrapper } from '@/components/client/StreakSectionWrapper'
import { CTAButton } from '@/components/client/CTAButton'
import { UnauthorizedBanner } from '@/components/shared/UnauthorizedBanner'
import { RecentActivity } from '@/components/client/RecentActivity'
import { useUserRealtime } from '@/hooks/useUserRealtime'
import Image from 'next/image'

export default function HomeView() {
  const dispatch = useAppDispatch()
  const user = useUser()
  const settings = useSettings()

  // ✨ Solo obtener el estado de conexión (la conexión es automática)
  const { isConnected } = useUserRealtime()

  if (!user) {
    return (
      <div className="space-y-4">
        <UnauthorizedBanner />
        <div className="text-center py-12">
          <p className="text-gray-500">Inicia sesión para ver tu progreso</p>
        </div>
      </div>
    )
  }

  // ⚡ Datos del usuario
  const hasStreaks = user.current_streak > 0
  const availableSpins = user.available_spins || 0
  const hasSpins = availableSpins > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con saludo y imagen del usuario */}
      <div className="bg-white px-6 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Hola, {user.first_name || 'Usuario'}! 👋
        </h1>
        <div className="relative w-24 h-24 mx-auto mb-4">
          <Image
            src="/images/streak-start-default.png"
            alt="Avatar del usuario"
            fill
            className="rounded-full object-cover"
          />
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="px-6 py-6 space-y-6">
        {/* Streak Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Tu Racha Actual</h2>
            <div className="text-4xl font-bold text-orange-500 mb-1">
              {user.current_streak}
            </div>
            <p className="text-gray-600">días consecutivos</p>
          </div>
          
          {hasStreaks && (
            <StreakSectionWrapper userId={user.id} />
          )}
        </div>

        {/* Giros Disponibles */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Giros Disponibles</h2>
            <div className="text-4xl font-bold text-purple-500 mb-1">
              {availableSpins}
            </div>
            <p className="text-gray-600">giros de ruleta</p>
          </div>
          
          {hasSpins && (
            <CTAButton>
              ¡Usar Giros en la Ruleta! 🎰
            </CTAButton>
          )}
        </div>

        {/* Check-ins Totales */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Check-ins Totales</h2>
            <div className="text-4xl font-bold text-green-500 mb-1">
              {user.total_checkins}
            </div>
            <p className="text-gray-600">visitas registradas</p>
          </div>
        </div>

        {/* Estado de conexión realtime */}
        {isConnected !== undefined && (
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
            </div>
          </div>
        )}

        {/* Actividad Reciente */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          <RecentActivity userId={user.id} />
        </div>
      </div>
    </div>
  )
}
