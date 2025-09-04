import { useUser } from '@/stores/app-store'

export default function ProfileView() {
  const user = useUser()

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inicia sesión para ver tu perfil</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Mi Perfil</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Nombre</label>
            <p className="text-lg">{user.first_name} {user.last_name}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Teléfono</label>
            <p className="text-lg">{user.phone || 'No registrado'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Total de visitas</label>
            <p className="text-lg">{user.total_checkins || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
