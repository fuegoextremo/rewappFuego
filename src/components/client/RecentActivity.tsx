'use client'

import { useSystemSettings } from '@/hooks/use-system-settings'
import { useRecentActivityRedux } from '@/hooks/useReduxStreaks'
import { formatCheckInDateTime, type CheckIn } from '@/hooks/queries/useRecentActivity'


type Props = {
  userId: string
}

export function RecentActivity({ userId }: Props) {
  const { data: checkIns = [], isLoading, error } = useRecentActivityRedux(userId)
  const { data: settings } = useSystemSettings()

  // 🔍 Debug logging mejorado
  console.log('🔍 RecentActivity render:', { 
    userId, 
    checkInsCount: checkIns.length, 
    isLoading, 
    error,
    latestCheckIn: checkIns[0]?.created_at,
    allCheckIns: checkIns.map(c => ({ id: c.id, date: c.check_in_date, created: c.created_at }))
  })

  const primaryColor = settings?.company_theme_primary || '#D73527'

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Error cargando actividad</h3>
        <p className="text-sm text-gray-500 mb-4">
          No pudimos cargar tu actividad reciente. Intenta recargar la página.
        </p>
      </div>
    )
  }

  if (checkIns.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-100 rounded-xl p-8">

        <h3 className="text-sm font-bold mb-2 text-gray-400">Sin actividad aún</h3>
        <p className="text-xs text-gray-400 mb-4">
          Cuando muestres tu código QR en Fuego Extremo, verás aquí el registro de tus visitas y avances.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">      
      {checkIns.map((checkIn: CheckIn) => (
        <div key={checkIn.id} className="rounded-xl p-4 bg-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">
                {formatCheckInDateTime(checkIn.created_at, checkIn.check_in_date)}
              </div>
              <div className="text-sm text-gray-500">
                {checkIn.branches?.name || 'Sucursal'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="text-sm font-semibold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: primaryColor }}
              >
                +{checkIn.spins_earned || 0} giros
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
