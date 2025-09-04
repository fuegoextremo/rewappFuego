import { createAdminClient } from "@/lib/supabase/admin";

export default async function DeepDiagnosticPage() {
  const supabase = createAdminClient();

  // IDs problemáticos del error
  const problematicIds = [
    'abebec04-c605-49fb-bbdb-f0e1db5a79b2',
    '7665a705-47e3-4518-9922-6f028588248f'
  ];

  // Verificar si estos IDs existen en user_profiles
  const { data: existingProfiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', problematicIds);

  // Verificar si estos IDs existen en auth.users
  const authResults = await Promise.all(
    problematicIds.map(async (id) => {
      const { data: authUser, error } = await supabase.auth.admin.getUserById(id);
      return { id, exists: !!authUser.user, error: error?.message, user: authUser.user };
    })
  );

  // Obtener todos los perfiles para contar
  const { data: allProfiles, count: profileCount } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, role, created_at', { count: 'exact' });

  // Obtener todos los usuarios de auth
  const { data: allAuthUsers } = await supabase.auth.admin.listUsers();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Diagnóstico Profundo del Problema</h1>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-red-800 mb-3">IDs Problemáticos</h2>
        <div className="space-y-4">
          {problematicIds.map(id => {
            const profileExists = existingProfiles?.some(p => p.id === id);
            const authResult = authResults.find(r => r.id === id);
            
            return (
              <div key={id} className="bg-white border rounded p-3">
                <div className="font-mono text-sm mb-2">{id}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>En user_profiles:</strong> 
                    <span className={profileExists ? "text-red-600 ml-2" : "text-green-600 ml-2"}>
                      {profileExists ? "SÍ EXISTE ❌" : "No existe ✅"}
                    </span>
                    {profileExists && (
                      <div className="mt-1 text-xs text-gray-600">
                        Perfil: {existingProfiles?.find(p => p.id === id)?.first_name} {existingProfiles?.find(p => p.id === id)?.last_name}
                      </div>
                    )}
                  </div>
                  <div>
                    <strong>En auth.users:</strong>
                    <span className={authResult?.exists ? "text-red-600 ml-2" : "text-green-600 ml-2"}>
                      {authResult?.exists ? "SÍ EXISTE ❌" : "No existe ✅"}
                    </span>
                    {authResult?.user && (
                      <div className="mt-1 text-xs text-gray-600">
                        Email: {authResult.user.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Estadísticas Generales</h3>
          <div className="space-y-2">
            <div>Total perfiles en BD: <strong>{profileCount}</strong></div>
            <div>Total usuarios en Auth: <strong>{allAuthUsers.users.length}</strong></div>
            <div>Diferencia: <strong>{Math.abs((profileCount || 0) - allAuthUsers.users.length)}</strong></div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Análisis del Problema</h3>
          <div className="text-sm space-y-2">
            {problematicIds.map(id => {
              const profileExists = existingProfiles?.some(p => p.id === id);
              const authResult = authResults.find(r => r.id === id);
              
              if (profileExists && authResult?.exists) {
                return (
                  <div key={id} className="text-orange-700">
                    ⚠️ ID {id.substring(0, 8)}... existe en AMBOS lados
                  </div>
                );
              } else if (profileExists && !authResult?.exists) {
                return (
                  <div key={id} className="text-red-700">
                    🔥 ID {id.substring(0, 8)}... existe en BD pero NO en Auth
                  </div>
                );
              } else if (!profileExists && authResult?.exists) {
                return (
                  <div key={id} className="text-purple-700">
                    👻 ID {id.substring(0, 8)}... existe en Auth pero NO en BD
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {existingProfiles && existingProfiles.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-3">Perfiles Problemáticos Encontrados</h3>
          <div className="space-y-2">
            {existingProfiles.map(profile => (
              <div key={profile.id} className="bg-white border rounded p-3">
                <div className="font-medium">{profile.first_name} {profile.last_name}</div>
                <div className="text-sm text-gray-600">Rol: {profile.role}</div>
                <div className="text-xs font-mono text-gray-500">ID: {profile.id}</div>
                <div className="text-xs text-gray-500">Creado: {profile.created_at ? new Date(profile.created_at).toLocaleString() : 'Sin fecha'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Acciones Recomendadas</h3>
        <ul className="space-y-1 text-green-700 text-sm">
          <li>• Si los perfiles existen en BD pero no en Auth: eliminar perfiles huérfanos</li>
          <li>• Si los usuarios existen en Auth pero no en BD: eliminar usuarios de Auth</li>
          <li>• Si existen en ambos: verificar por qué se están intentando crear duplicados</li>
        </ul>
      </div>
    </div>
  );
}
