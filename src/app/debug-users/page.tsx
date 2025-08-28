import { createAdminClient } from '@/lib/supabase/admin'

export default async function DebugUsersPage() {
  const supabase = createAdminClient()
  
  // Ver todos los usuarios
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, unique_code, role')
    .limit(10)
  
  // Ver check-ins recientes
  const { data: checkins, error: checkinsError } = await supabase
    .from('check_ins')
    .select('id, user_id, verified_by, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  // Ver redenciones recientes
  const { data: redemptions, error: redemptionsError } = await supabase
    .from('coupons')
    .select('id, user_id, redeemed_by, redeemed_at')
    .not('redeemed_at', 'is', null)
    .order('redeemed_at', { ascending: false })
    .limit(5)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Debug - Datos de Usuarios</h1>
      
      <div>
        <h2 className="text-xl font-semibold">Usuarios en la BD:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(users, null, 2)}
        </pre>
        {error && <p className="text-red-500">Error: {error.message}</p>}
      </div>

      <div>
        <h2 className="text-xl font-semibold">Check-ins recientes:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(checkins, null, 2)}
        </pre>
        {checkinsError && <p className="text-red-500">Error: {checkinsError.message}</p>}
      </div>

      <div>
        <h2 className="text-xl font-semibold">Redenciones recientes:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(redemptions, null, 2)}
        </pre>
        {redemptionsError && <p className="text-red-500">Error: {redemptionsError.message}</p>}
      </div>
    </div>
  )
}
