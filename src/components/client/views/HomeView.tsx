import { useUser, useSettings, useAppDispatch } from '@/store/hooks'
import { setCurrentView } from '@/store/slices/uiSlice'
import { StreakSectionWrapper } from '@/components/client/StreakSectionWrapper'
import { CTAButton } from '@/components/client/CTAButton'
import { UnauthorizedBanner } from '@/components/shared/UnauthorizedBanner'
import { RecentActivity } from '@/components/client/RecentActivity'
import { useUserRealtime } from '@/hooks/useUserRealtime'
import { Goal, FerrisWheel } from 'lucide-react'
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
  const primaryColor = settings.company_theme_primary || '#D73527'

  // Estados de datos para mostrar mensajes útiles
  const hasVisits = (user.total_checkins || 0) > 0
  const hasSpins = (user.available_spins || 0) > 0
  {/*const hasStreak = (user.current_streak || 0) > 0*/}

  return (
    <div className="space-y-6">      
      {/* Header con saludo personalizado */}
      <div className="px-4 text-center mb-6">
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
        className="px-4 cursor-pointer"
      >
        <CTAButton>
          ¡Registra tu visita!
        </CTAButton>
      </div>

      {/* Grid de estadísticas - Con datos reales y estados de carga */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        <div className="bg-neutral-900 rounded-3xl p-4 shadow-sm border">
          <Goal 
            size={25} 
            style={{ color: primaryColor }} 
            className="mb-1" 
            data-lucide
          />
          <h3 className="text-white text-sm">Visitas</h3>
          {userDataLoaded ? (
            <p className="text-xl font-bold text-white">
              {user.total_checkins || 0}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Cargando...</p>
          )}
          {userDataLoaded && !hasVisits && (
            <p className="text-xs text-gray-400">¡Haz tu primera visita!</p>
          )}
        </div>
        
        <div className="bg-neutral-100 rounded-3xl p-4 shadow-sm border">
          <FerrisWheel 
            size={25} 
            className="mb-1 text-black" 
            data-lucide
          />
          <h3 className="font-semibold text-sm">Giros</h3>
          {userDataLoaded ? (
            <p className="text-xl font-bold text-black">
              {user.available_spins || 0}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Cargando...</p>
          )}
          {userDataLoaded && !hasSpins && (
            <p className="text-xs text-gray-400">Gana giros visitando</p>
          )}
        </div>
        
       { /*<div className="bg-white rounded-lg p-4 shadow-sm border">
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
        </div>*/}
      </div>

      {/* Sección de racha - Usando componente original que funciona */}
      <StreakSectionWrapper />

      {/* Actividad reciente - Componente funcional */}
      <div className="bg-white rounded-lg">
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900">Actividad reciente</h3>
        </div>
        <div className="p-2">
          <RecentActivity userId={user.id} />
        </div>
      </div>

      {/* Logo del establecimiento */}
      {settings.company_logo_url && (
        <div className="text-center py-6">
          <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden flex items-center justify-center p-2">
            <Image 
              src={settings.company_logo_url} 
              alt={companyName}
              width={160}
              height={160}
              className="object-contain w-full h-full"
              priority
            />
          </div>
        </div>
      )}
    </div>
  )
}
