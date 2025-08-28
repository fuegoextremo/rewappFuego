'use client'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, Gift } from 'lucide-react'
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

function ActivityBadge({ type }: { type: 'checkin' | 'redemption' }) {
  if (type === 'checkin') {
    return <Badge variant="outline" className="text-green-700 border-green-200">Check-in</Badge>
  }
  return <Badge variant="outline" className="text-blue-700 border-blue-200">Redención</Badge>
}

function formatDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ScanHistoryTable({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay registros de escaneos.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Tipo</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Detalles</TableHead>
            <TableHead>Verificado por</TableHead>
            <TableHead>Fecha y Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <ActivityIcon type={activity.type} />
                  <ActivityBadge type={activity.type} />
                </div>
              </TableCell>
              
              <TableCell className="font-medium">
                {activity.user_name}
              </TableCell>
              
              <TableCell>
                <span className="font-mono text-sm text-gray-600">
                  #{activity.user_unique_code}
                </span>
              </TableCell>
              
              <TableCell>
                {activity.type === 'checkin' ? (
                  <span className="text-sm text-gray-600">
                    {activity.branch_name || 'Sucursal no especificada'}
                  </span>
                ) : (
                  <span className="text-sm text-gray-600">
                    {activity.prize_name || 'Premio no especificado'}
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                <span className="text-sm text-gray-600">
                  {activity.verified_by_name}
                </span>
              </TableCell>
              
              <TableCell>
                <span className="text-sm text-gray-600">
                  {formatDateTime(activity.timestamp)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
