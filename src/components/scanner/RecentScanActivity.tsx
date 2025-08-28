'use client'

import Link from 'next/link'
import { Clock, CheckCircle, Gift } from 'lucide-react'
import { ScanActivity } from '@/app/admin/scanner/queries'

type Props = {
  activities: ScanActivity[]
}

function ActivityIcon({ type }: { type: 'checkin' | 'redemption' }) {
  if (type === 'checkin') {
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }
  return <Gift className="h-4 w-4 text-blue-600" />
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function RecentScanActivity({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Actividad reciente</h3>
        <p className="text-sm text-gray-500">No hay escaneos recientes.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Actividad reciente</h3>
        <Link 
          href="/admin/scanner/history"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Ver todas →
        </Link>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className="flex items-center gap-3 p-3 bg-white border rounded-lg"
          >
            <ActivityIcon type={activity.type} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">
                  {activity.user_name}
                </span>
                <span className="text-xs text-gray-500">
                  #{activity.user_unique_code}
                </span>
              </div>
              
              <div className="text-xs text-gray-600">
                {activity.type === 'checkin' ? (
                  <>Check-in {activity.branch_name && `• ${activity.branch_name}`}</>
                ) : (
                  <>Redención {activity.prize_name && `• ${activity.prize_name}`}</>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatTime(activity.timestamp)}
            </div>
          </div>
        ))}
      </div>

      {activities.length >= 5 && (
        <div className="text-center">
          <Link 
            href="/admin/scanner/history"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            Ver historial completo
          </Link>
        </div>
      )}
    </div>
  )
}
