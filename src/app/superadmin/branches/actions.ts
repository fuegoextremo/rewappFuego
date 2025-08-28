"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Tables } from "@/types/database";

type BranchData = Omit<Tables<"branches">, "id" | "created_at" | "updated_at">;

// Crear nueva sucursal
export async function createBranch(data: BranchData) {
  const supabase = createAdminClient();
  
  const { data: branch, error } = await supabase
    .from("branches")
    .insert([{
      name: data.name,
      address: data.address,
      is_active: data.is_active ?? true,
    }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/superadmin/branches");
  return branch;
}

// Actualizar sucursal
export async function updateBranch(id: string, data: Partial<BranchData>) {
  const supabase = createAdminClient();
  
  const { data: branch, error } = await supabase
    .from("branches")
    .update({
      name: data.name,
      address: data.address,
      is_active: data.is_active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/superadmin/branches");
  return branch;
}

// Eliminar sucursal (soft delete - marcar como inactiva)
export async function deleteBranch(id: string) {
  const supabase = createAdminClient();
  
  // Verificar si hay usuarios asignados a esta sucursal
  const { count: userCount } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", id);

  if (userCount && userCount > 0) {
    throw new Error(`No se puede eliminar: hay ${userCount} usuario(s) asignado(s) a esta sucursal`);
  }

  // Marcar como inactiva en lugar de eliminar
  const { error } = await supabase
    .from("branches")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/superadmin/branches");
}

// Alternar estado activo/inactivo
export async function toggleBranchStatus(id: string, currentStatus: boolean) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from("branches")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/superadmin/branches");
}

// Obtener estadísticas detalladas de una sucursal
export async function getBranchStats(id: string) {
  const supabase = createAdminClient();
  
  const [
    { count: totalUsers },
    { count: totalCheckins },
    { count: totalCoupons },
    { data: recentActivity }
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", id),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", id),
    supabase
      .from("coupons")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", id),
    supabase
      .from("check_ins")
      .select(`
        id,
        created_at,
        user_profiles!check_ins_user_id_fkey (first_name, last_name)
      `)
      .eq("branch_id", id)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalCheckins: totalCheckins || 0,
    totalCoupons: totalCoupons || 0,
    recentActivity: recentActivity || []
  };
}
