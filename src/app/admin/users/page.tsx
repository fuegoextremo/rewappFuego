
import { createAdminClient } from "@/lib/supabase/admin";
import UserTable from "@/components/admin/UserTable";
import { Tables } from "@/types/database";

// Define a new type for the merged user data
export type UserWithDetails = Tables<"user_profiles"> & {
  email: string | undefined;
  provider: string | undefined;
  check_ins: [{ count: number }];
  coupons: [{ count: number }];
};

export default async function Page() {
  const supabase = createAdminClient();

  // 1. Fetch all authentication users
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

  // 2. Fetch all user profiles with counts
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select(`
      *,
      check_ins!check_ins_user_id_fkey ( count ),
      coupons!coupons_user_id_fkey ( count )
    `);

  if (authError || profilesError) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-red-500">Error al cargar los usuarios.</p>
        {authError && <p>Auth Error: {authError.message}</p>}
        {profilesError && <p>Profiles Error: {profilesError.message}</p>}
      </div>
    );
  }

  // 3. Merge the data
  const usersWithDetails: UserWithDetails[] = profiles!.map(profile => {
    const authUser = authUsers.find(u => u.id === profile.id);
    return {
      ...profile,
      email: authUser?.email,
      provider: authUser?.app_metadata.provider,
      // Ensure counts are arrays with at least one object
      check_ins: Array.isArray(profile.check_ins) ? profile.check_ins : [{ count: 0 }],
      coupons: Array.isArray(profile.coupons) ? profile.coupons : [{ count: 0 }],
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
      <UserTable users={usersWithDetails || []} />
    </div>
  );
}
