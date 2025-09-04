import { createAdminClient } from "@/lib/supabase/admin";

export default async function CleanDBDiagnosticPage() {
  const supabase = createAdminClient();

  // Obtener TODOS los usuarios de Auth
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  // Obtener TODOS los perfiles
  const { data: profiles, count: profileCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact' });

  // IDs problemáticos del error reciente
  const problematicIds = [
    'abebec04-c605-49fb-bbdb-f0e1db5a79b2',
    '7665a705-47e3-4518-9922-6f028588248f'
  ];

  // Verificar si estos IDs específicos existen
  const checkResults = await Promise.all(
    problematicIds.map(async (id) => {
      // Verificar en user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // Verificar en auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);

      return {
        id,
        inProfiles: !!profile,
        inAuth: !!authUser.user && !authError,
        profile,
        authUser: authUser.user,
        authError: authError?.message
      };
    })
  );

  // Verificar constrains - removiendo la consulta SQL que no funciona
  // const constraintInfo = "user_profiles_pkey (constraint existe)";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-600">Diagnóstico Base de Datos Limpia</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">Estado Actual de la BD</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Usuarios en Auth:</strong> {authUsers.users.length}
          </div>
          <div>
            <strong>Perfiles en BD:</strong> {profileCount || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuarios de Auth */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Usuarios en Auth ({authUsers.users.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {authUsers.users.map(user => (
              <div key={user.id} className="border-b pb-2">
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-gray-500 font-mono">{user.id}</div>
                <div className="text-xs text-gray-400">
                  Creado: {new Date(user.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Perfiles en BD */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Perfiles en BD ({profileCount || 0})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {profiles?.map(profile => (
              <div key={profile.id} className="border-b pb-2">
                <div className="font-medium">{profile.first_name} {profile.last_name}</div>
                <div className="text-sm text-gray-600">Rol: {profile.role}</div>
                <div className="text-sm text-gray-500 font-mono">{profile.id}</div>
                <div className="text-xs text-gray-400">
                  Creado: {profile.created_at ? new Date(profile.created_at).toLocaleString() : 'Sin fecha'}
                </div>
              </div>
            )) || <div className="text-gray-500">No hay perfiles</div>}
          </div>
        </div>
      </div>

      {/* Análisis de IDs problemáticos */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-3">
          Análisis de IDs Problemáticos del Error
        </h3>
        <div className="space-y-4">
          {checkResults.map(result => (
            <div key={result.id} className="bg-white border rounded p-3">
              <div className="font-mono text-sm mb-2">{result.id}</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>En user_profiles:</strong> 
                  <span className={result.inProfiles ? "text-red-600 ml-2" : "text-green-600 ml-2"}>
                    {result.inProfiles ? "SÍ EXISTE ❌" : "No existe ✅"}
                  </span>
                  {result.profile && (
                    <div className="text-xs text-gray-600 mt-1">
                      {result.profile.first_name} {result.profile.last_name} - {result.profile.role}
                    </div>
                  )}
                </div>
                <div>
                  <strong>En auth.users:</strong>
                  <span className={result.inAuth ? "text-red-600 ml-2" : "text-green-600 ml-2"}>
                    {result.inAuth ? "SÍ EXISTE ❌" : "No existe ✅"}
                  </span>
                  {result.authUser && (
                    <div className="text-xs text-gray-600 mt-1">
                      {result.authUser.email}
                    </div>
                  )}
                  {result.authError && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {result.authError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">Análisis y Recomendaciones</h3>
        <div className="space-y-2 text-sm">
          {checkResults.some(r => r.inProfiles || r.inAuth) ? (
            <div className="text-red-700">
              🚨 <strong>PROBLEMA ENCONTRADO:</strong> Los IDs del error SÍ existen en la base de datos.
              Esto significa que el reset no fue completo o hay datos residuales.
            </div>
          ) : (
            <div className="text-green-700">
              ✅ <strong>IDs LIMPIOS:</strong> Los IDs del error NO existen en la BD actual.
              El problema podría ser de caché o configuración.
            </div>
          )}
          
          <div className="mt-4 space-y-1">
            <div>• Verifica que la base de datos esté realmente limpia</div>
            <div>• Considera reiniciar el servidor de desarrollo</div>
            <div>• Revisa los logs de Supabase para más detalles</div>
            <div>• Intenta crear un usuario con un email diferente</div>
          </div>
        </div>
      </div>

      {/* Información de constraints */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Información de Tabla</h3>
        <div className="text-sm">
          <strong>Constraint de Primary Key:</strong> 
          <span className="ml-2 font-mono">user_profiles_pkey (verificar en Supabase Dashboard)</span>
        </div>
      </div>
    </div>
  );
}
