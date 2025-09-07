'use client'

import { useUser } from '@/store/hooks'
import { useUserSpins, useRoulettePrizes, getRarityFromWeight } from '@/hooks/queries/useRouletteQueries'
import { useSystemSettings } from '@/hooks/use-system-settings'
import SpinButton from '@/app/client/roulette/spin-button'

export default function RouletteView() {
  const user = useUser()
  const { data: settings, isLoading: settingsLoading } = useSystemSettings()
  const { data: spinsData, isLoading: spinsLoading } = useUserSpins(user?.id || '')
  const { data: prizes, isLoading: prizesLoading } = useRoulettePrizes()

  // ✨ Loading inteligente
  const hasUser = !!user
  const hasSettings = !!settings
  const isActuallyLoading = (settingsLoading && !hasSettings) || spinsLoading || prizesLoading

  if (!hasUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inicia sesión para jugar la ruleta</p>
      </div>
    )
  }

  // ✨ Skeleton solo cuando realmente necesario
  if (isActuallyLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="text-center space-y-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const availableSpins = spinsData?.availableSpins ?? 0
  const hasSpins = availableSpins > 0
  const primaryColor = settings?.company_theme_primary || '#3B82F6'

  return (
    <div className="space-y-6">
      {/* 🎰 Sección principal de ruleta */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">🎰 Ruleta de Premios</h2>
        
        <div className="text-center space-y-4">
          <div>
            <div 
              className="text-4xl font-bold mb-1"
              style={{ color: primaryColor }}
            >
              {availableSpins}
            </div>
            <div className="text-sm text-gray-500">Giros disponibles</div>
          </div>
          
          <SpinButton disabled={!hasSpins} />
          
          {!hasSpins && (
            <div className="text-gray-500 mt-4">
              <p className="text-sm">No tienes giros disponibles</p>
              <p className="text-xs mt-1">Realiza check-ins para ganar giros</p>
            </div>
          )}
        </div>
      </div>

      {/* 🏆 Lista de premios disponibles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">🎁 Premios Disponibles</h3>
        
        {prizes && prizes.length > 0 ? (
          <div className="space-y-3">
            {prizes.map((prize) => {
              const rarity = getRarityFromWeight(prize.weight || 1)
              return (
                <div
                  key={prize.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{prize.name}</h4>
                      {prize.description && (
                        <p className="text-sm text-gray-600 mt-1">{prize.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${rarity.color}`}>
                          {rarity.emoji} {rarity.label}
                        </span>
                        {prize.validity_days && (
                          <span className="text-xs text-gray-500">
                            Válido por {prize.validity_days} días
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      {prize.inventory_count ? `${prize.inventory_count} disponibles` : 'Stock ilimitado'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay premios disponibles actualmente</p>
          </div>
        )}
        
        {/* 💡 Tip informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>💡 Tip:</strong> Los premios más raros tienen menor probabilidad, pero ¡siempre hay una oportunidad de ganar!
          </p>
        </div>
      </div>
    </div>
  )
}
