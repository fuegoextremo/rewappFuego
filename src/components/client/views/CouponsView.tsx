import { useUser } from '@/store/hooks'

export default function CouponsView() {
  const user = useUser()

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inicia sesión para ver tus cupones</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Mis Cupones</h2>
        
        <div className="text-center py-8">
          <p className="text-gray-500">No tienes cupones disponibles</p>
          <p className="text-sm text-gray-400 mt-2">
            Realiza check-ins para ganar recompensas
          </p>
        </div>
      </div>
    </div>
  )
}
