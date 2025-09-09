'use client'

import { useSystemSettings } from '@/hooks/use-system-settings'

type StatsCardProps = {
  title: string
  value: number
  icon: string
  subtitle?: string
}

function StatsCard({ title, value, icon, subtitle }: StatsCardProps) {
  const { data: settings } = useSystemSettings()
  const primaryColor = settings?.company_theme_primary || '#D73527'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="text-right">
          <div 
            className="text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            {value}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

type Props = {
  visitas: number
  giros: number
}

export function StatsGrid({ visitas, giros }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <StatsCard
        title="Completaste"
        value={visitas}
        subtitle="Visitas"
        icon="🏠"
      />
      <StatsCard
        title="Tienes"
        value={giros}
        subtitle="Giros de ruleta"
        icon="⚙️"
      />
    </div>
  )
}
