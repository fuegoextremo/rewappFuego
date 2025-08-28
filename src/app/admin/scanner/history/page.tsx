import { getScanHistory } from '../queries'
import Breadcrumbs from '@/components/shared/Breadcrumbs'
import ScanHistoryTable from '@/components/scanner/ScanHistoryTable'

export default async function ScanHistoryPage() {
  const { activities } = await getScanHistory()

  const breadcrumbItems = [
    { label: 'Scanner', href: '/admin/scanner' },
    { label: 'Historial', current: true }
  ]

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Escaneos</h1>
          <p className="text-gray-600">Registro completo de check-ins y redenciones</p>
        </div>
      </div>

      {/* Table */}
      <ScanHistoryTable activities={activities} />
    </div>
  )
}
