import { createAdminClient } from "@/lib/supabase/admin";

export default async function DiagnosticPage() {
  const supabase = createAdminClient();

  // Obtener usuarios de Auth
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  // Obtener perfiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, role');

  // Crear mapas para comparación
  const authUserMap = new Map(authUsers.users.map(u => [u.id, u]));
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Encontrar usuarios huérfanos (en Auth sin perfil)
  const orphanedAuthUsers = authUsers.users.filter(user => !profileMap.has(user.id));
  
  // Encontrar perfiles huérfanos (perfiles sin usuario de Auth)
  const orphanedProfiles = profiles?.filter(profile => !authUserMap.has(profile.id)) || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Diagnóstico de Usuarios</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Usuarios en Auth</h2>
          <p className="text-gray-600 mb-4">Total: {authUsers.users.length}</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {authUsers.users.map(user => (
              <div key={user.id} className="text-sm border-b pb-1">
                <div>{user.email}</div>
                <div className="text-gray-500">ID: {user.id}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Perfiles en BD</h2>
          <p className="text-gray-600 mb-4">Total: {profiles?.length || 0}</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {profiles?.map(profile => (
              <div key={profile.id} className="text-sm border-b pb-1">
                <div>{profile.first_name} {profile.last_name}</div>
                <div className="text-gray-500">Role: {profile.role}</div>
                <div className="text-gray-400">ID: {profile.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-3">
            Usuarios Huérfanos en Auth ({orphanedAuthUsers.length})
          </h2>
          <p className="text-red-600 mb-4">Usuarios de Auth sin perfil en BD</p>
          <div className="space-y-2">
            {orphanedAuthUsers.map(user => (
              <div key={user.id} className="text-sm bg-white p-2 rounded border">
                <div className="font-medium">{user.email}</div>
                <div className="text-gray-500">ID: {user.id}</div>
                <div className="text-gray-500">Creado: {new Date(user.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">
            Perfiles Huérfanos en BD ({orphanedProfiles.length})
          </h2>
          <p className="text-yellow-600 mb-4">Perfiles en BD sin usuario de Auth</p>
          <div className="space-y-2">
            {orphanedProfiles.map(profile => (
              <div key={profile.id} className="text-sm bg-white p-2 rounded border">
                <div className="font-medium">{profile.first_name} {profile.last_name}</div>
                <div className="text-gray-500">Role: {profile.role}</div>
                <div className="text-gray-500">ID: {profile.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Recomendaciones</h3>
        <ul className="space-y-1 text-blue-700">
          <li>• Los usuarios huérfanos en Auth deben ser eliminados</li>
          <li>• Los perfiles huérfanos en BD pueden indicar usuarios eliminados incorrectamente</li>
          <li>• Usa el botón &quot;Limpiar Usuarios Huérfanos&quot; en la página principal para resolver esto</li>
        </ul>
      </div>
    </div>
  );
}
