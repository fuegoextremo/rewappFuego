import { useUser } from '@/stores/app-store'

export default function RouletteView() {
  const user = useUser()

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inicia sesión para jugar la ruleta</p>
      </div>
    )
  }

  const hasSpins = (user.available_spins || 0) > 0

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Ruleta de Premios</h2>
        
        <div className="text-center">
          <div className="mb-4">
            <div className="text-3xl font-bold text-blue-600">
              {user.available_spins || 0}
            </div>
            <div className="text-sm text-gray-500">Giros disponibles</div>
          </div>
          
          {hasSpins ? (
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              ¡Girar Ruleta!
            </button>
          ) : (
            <div className="text-gray-500">
              <p>No tienes giros disponibles</p>
              <p className="text-sm mt-2">Realiza check-ins para ganar giros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
