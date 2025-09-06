'use client'

import { CheckinData } from '@/stores/app-store'

type Props = {
  checkins: CheckinData[]
}

export function SimpleRecentActivity({ checkins }: Props) {
  if (!checkins || checkins.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actividad Reciente</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-500">No hay actividad reciente</p>
          <p className="text-sm text-gray-400 mt-1">¡Haz tu primer check-in!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Actividad Reciente</h3>
      <div className="space-y-3">
        {checkins.slice(0, 5).map((checkin) => (
          <div key={checkin.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Check-in realizado</p>
                <p className="text-xs text-gray-500">
                  {checkin.created_at ? new Date(checkin.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Fecha no disponible'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-green-600">
                +{checkin.streak_count || 1} racha
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {checkins.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700">
            Ver todas las actividades
          </button>
        </div>
      )}
    </div>
  )
}
