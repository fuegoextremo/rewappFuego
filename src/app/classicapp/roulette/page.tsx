import { createClientServer } from '@/lib/supabase/server'
import { redirect } from "next/navigation";
import SpinButton from '../../client/roulette/spin-button' // Reutilizamos el componente
import Link from "next/link";

export const revalidate = 0

// Helper function for rarity display
const getRarityFromWeight = (weight: number): { label: string; color: string; emoji: string } => {
  if (weight >= 16) return { label: 'Muy Común', color: 'bg-green-50 text-green-700 border-green-200', emoji: '🟢' };
  if (weight >= 10) return { label: 'Común', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', emoji: '🟡' };
  if (weight >= 5) return { label: 'Raro', color: 'bg-orange-50 text-orange-700 border-orange-200', emoji: '🟠' };
  if (weight >= 2) return { label: 'Épico', color: 'bg-red-50 text-red-700 border-red-200', emoji: '🔴' };
  return { label: 'Legendario', color: 'bg-purple-50 text-purple-700 border-purple-200', emoji: '🟣' };
};

export default async function ClassicRoulettePage() {
  const supabase = createClientServer()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  const { data: spinsRow } = await supabase
    .from('user_spins')
    .select('available_spins')
    .eq('user_id', user.id)
    .maybeSingle()

  // Get available roulette prizes
  const { data: prizes } = await supabase
    .from('prizes')
    .select('*')
    .eq('type', 'roulette')
    .eq('is_active', true)
    .gt('inventory_count', 0)
    .order('weight', { ascending: false })

  const spins = spinsRow?.available_spins ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de navegación */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link 
            href="/classicapp" 
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Volver
          </Link>
          <h1 className="font-semibold">🎰 Ruleta</h1>
          <div className="w-16"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        <div className="bg-white rounded-lg p-4 text-center">
          <h2 className="text-lg font-bold mb-2">🎰 Ruleta de Premios</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tienes <strong className="text-red-600">{spins}</strong> giro(s) disponible(s).
          </p>
          <SpinButton disabled={spins <= 0} />
        </div>

        {/* Premios Disponibles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">🎁 Premios Disponibles</h3>
          <div className="grid gap-3">
            {prizes?.map((prize) => {
              const rarity = getRarityFromWeight(prize.weight || 1);
              return (
                <div
                  key={prize.id}
                  className="p-4 rounded-lg border bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{prize.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{prize.description}</p>
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
              );
            })}
          </div>
          
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>💡 Tip:</strong> Los premios más raros tienen menor probabilidad, pero ¡siempre hay una oportunidad de ganar!
            </p>
          </div>
        </div>

        {/* Switch a SPA */}
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-700 mb-2">¿Prefieres la experiencia SPA?</p>
          <Link 
            href="/client" 
            className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            🚀 Ir a SPA App
          </Link>
        </div>
      </div>
    </div>
  );
}
