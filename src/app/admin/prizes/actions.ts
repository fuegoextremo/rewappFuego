"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Tables } from "@/types/database";

// Tipo para crear premios - campos requeridos definidos
export type CreatePrizeData = Omit<Tables<"prizes">, "id" | "created_at" | "deleted_at"> & {
  name: string;
  type: "roulette" | "streak";
};

export async function createPrize(prize: CreatePrizeData) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prizes")
    .insert([prize])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear el premio: ${error.message}`);
  }

  revalidatePath("/admin/prizes");
  return data;
}

export async function updatePrize(prizeId: string, prize: Partial<Tables<"prizes">>) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prizes")
    .update(prize)
    .eq("id", prizeId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al actualizar el premio: ${error.message}`);
  }

  revalidatePath("/admin/prizes");
  return data;
}

export async function deletePrize(prizeId: string) {
  const supabase = createAdminClient();

  // En lugar de eliminar, marcamos como eliminado
  const { error } = await supabase
    .from("prizes")
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", prizeId);

  if (error) {
    throw new Error(`Error al eliminar el premio: ${error.message}`);
  }

  revalidatePath("/admin/prizes");
}
