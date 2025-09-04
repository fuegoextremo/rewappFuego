import { useUser, useAppSettings } from '@/stores/app-store'
import { StreakSection } from '@/components/client/StreakSection'
import { UnauthorizedBanner } from '@/components/shared/UnauthorizedBanner'

export default function HomeView() {
  const user = useUser()
  const settings = useAppSettings()

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

  return (
    <div className="space-y-6">
      {/* Resumen rápido */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Tu resumen</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{user.total_checkins || 0}</div>
            <div className="text-xs text-gray-500">Visitas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{user.available_spins || 0}</div>
            <div className="text-xs text-gray-500">Giros</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{user.current_streak || 0}</div>
            <div className="text-xs text-gray-500">Racha</div>
          </div>
        </div>
      </div>

      {/* Sección de racha */}
      <StreakSection 
        userId={user.id} 
        currentCount={user.current_streak || 0} 
      />

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3">Acciones rápidas</h3>
        <div className="space-y-2">
          <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="font-medium">Ver mis cupones</div>
            <div className="text-sm text-gray-500">Revisa tus recompensas disponibles</div>
          </button>
          <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="font-medium">Jugar ruleta</div>
            <div className="text-sm text-gray-500">Usa tus giros para ganar premios</div>
          </button>
        </div>
      </div>
    </div>
  )
}
