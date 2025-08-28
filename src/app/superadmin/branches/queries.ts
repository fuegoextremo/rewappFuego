"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type BranchWithStats = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  user_profiles: [{ count: number }];
  check_ins: [{ count: number }];
};

export async function getBranches(): Promise<BranchWithStats[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('branches')
    .select(`
      *,
      user_profiles:user_profiles!user_profiles_branch_id_fkey(count),
      check_ins:check_ins!check_ins_branch_id_fkey(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading branches:', error);
    throw new Error('Error al cargar las sucursales');
  }

  return data as BranchWithStats[] || [];
}
