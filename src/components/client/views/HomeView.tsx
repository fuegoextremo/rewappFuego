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

  // Verificar si los datos del usuario están completamente cargados
  const userDataLoaded = user && typeof user.total_checkins === 'number'

  // Generar saludo personalizado
  const userName = user.first_name ? user.first_name : 'Usuario'
  const greeting = `¡Hola ${userName}!`
  const companyName = settings.company_name || 'Fuego Rewards'

  // Estados de datos para mostrar mensajes útiles
  const hasVisits = (user.total_checkins || 0) > 0
  const hasSpins = (user.available_spins || 0) > 0
  const hasStreak = (user.current_streak || 0) > 0

  return (
    <div className="space-y-6">      
      {/* Header con saludo personalizado */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-2xl">🔥</div>
          <h1 className="text-2xl font-bold">{companyName}</h1>
          
          {/* ✨ Indicador de conexión realtime */}
          {isConnected && (
            <div className="ml-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              En vivo
            </div>
          )}
        </div>
        <p className="text-lg font-medium text-gray-800 mb-2">
          {greeting}
        </p>
        <p className="text-gray-600">
          ¡Visita {companyName}! <strong>Registra tus visitas y participa</strong> en la ruleta para ganar increíbles regalos.
        </p>
      </div>

      {/* Botón CTA principal */}
      <div 
        onClick={() => dispatch(setCurrentView('roulette'))}
        className="cursor-pointer"
      >
        <CTAButton>
          🎰 ¡Jugar Ruleta!
        </CTAButton>
      </div>

      {/* Grid de estadísticas - Con datos reales y estados de carga */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-xl mb-1">📊</div>
          <h3 className="font-semibold text-sm">Visitas</h3>
          {userDataLoaded ? (
            <p className="text-xl font-bold text-blue-600">
              {user.total_checkins || 0}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Cargando...</p>
          )}
          {userDataLoaded && !hasVisits && (
            <p className="text-xs text-gray-400">¡Haz tu primera visita!</p>
          )}
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-xl mb-1">🎯</div>
          <h3 className="font-semibold text-sm">Giros</h3>
          {userDataLoaded ? (
            <p className="text-xl font-bold text-emerald-600">
              {user.available_spins || 0}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Cargando...</p>
          )}
          {userDataLoaded && !hasSpins && (
            <p className="text-xs text-gray-400">Gana giros visitando</p>
          )}
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-xl mb-1">🔥</div>
          <h3 className="font-semibold text-sm">Racha</h3>
          {userDataLoaded ? (
            <p className="text-xl font-bold text-orange-600">
              {user.current_streak || 0}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Cargando...</p>
          )}
          {userDataLoaded && !hasStreak && (
            <p className="text-xs text-gray-400">Inicia tu racha</p>
          )}
        </div>
      </div>

      {/* Sección de racha - Usando componente original que funciona */}
      <StreakSectionWrapper userId={user.id} />

      {/* Actividad reciente - Componente funcional */}
      <div className="bg-white rounded-lg shadow-sm border">
        <RecentActivity userId={user.id} />
      </div>

      {/* Logo del establecimiento */}
      {settings.company_logo_url && (
        <div className="text-center py-6">
          <Image 
            src={settings.company_logo_url} 
            alt={companyName}
            width={64}
            height={64}
            className="mx-auto opacity-60"
          />
        </div>
      )}
    </div>
  )
}
