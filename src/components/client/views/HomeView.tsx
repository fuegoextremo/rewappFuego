import { useUser, useAppSettings, useSimpleAppStore } from '@/stores/simple-app-store'
import { StreakSectionWrapper } from '@/components/client/StreakSectionWrapper'
import { CTAButton } from '@/components/client/CTAButton'
import { UnauthorizedBanner } from '@/components/shared/UnauthorizedBanner'
import Image from 'next/image'

export default function HomeView() {
  const user = useUser()
  const settings = useAppSettings()
  const setCurrentView = useSimpleAppStore((state) => state.setCurrentView)

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

  // Generar saludo personalizado
  const userName = user.first_name ? user.first_name : 'Usuario'
  const greeting = `¡Hola ${userName}!`
  const companyName = settings.company_name || 'Fuego Rewards'

  return (
    <div className="space-y-6">      
      {/* Header con saludo personalizado */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-2xl">🔥</div>
          <h1 className="text-2xl font-bold">{companyName}</h1>
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
        onClick={() => setCurrentView('roulette')}
        className="cursor-pointer"
      >
        <CTAButton>
          🎰 ¡Jugar Ruleta!
        </CTAButton>
      </div>

      {/* Grid de estadísticas - Simplificado */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold">Visitas</h3>
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-semibold">Giros</h3>
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>

      {/* Sección de racha - Usando componente original que funciona */}
      <StreakSectionWrapper userId={user.id} />

      {/* Actividad reciente - Placeholder */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-semibold mb-3">Actividad Reciente</h3>
        <p className="text-gray-500 text-sm">Cargando actividad...</p>
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
