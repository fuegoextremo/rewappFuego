"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updatePrizeLimits(maxRoulette: number, maxStreak: number) {
  const supabase = createAdminClient()
  
  // Obtener usuario admin actual
  const { data: user, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user?.user) {
    throw new Error('Usuario no autenticado')
  }

  // Type assertion para la función RPC custom
  type SupabaseWithCustomRpc = typeof supabase & {
    rpc: (
      fn: 'update_prize_limits',
      args: { p_max_roulette: number; p_max_streak: number; p_user_id: string }
    ) => Promise<{ data: unknown; error: unknown }>
  }

  const { data, error } = await (supabase as SupabaseWithCustomRpc).rpc('update_prize_limits', {
    p_max_roulette: maxRoulette,
    p_max_streak: maxStreak,
    p_user_id: user.user.id
  });

  if (error) {
    console.error('Error updating prize limits:', error)
    throw new Error('Error al actualizar límites de premios');
  }

  revalidatePath('/admin/settings');
  return data;
}

export async function getPrizeLimits() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('app_configurations')
    .select('value')
    .eq('key', 'prize_limits')
    .single();

  if (error) {
    throw new Error(`Error al obtener límites: ${error.message}`);
  }

  return data.value;
}
