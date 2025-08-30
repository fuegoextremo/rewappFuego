"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { Tables } from "@/types/database";

// Tipo para crear premios - campos requeridos definidos
export type CreatePrizeData = Omit<Tables<"prizes">, "id" | "created_at" | "deleted_at"> & {
  name: string;
  type: "roulette" | "streak";
};

// Función auxiliar para obtener límites de premios
async function getPrizeLimitsFromDB() {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'prize_limits')
    .eq('category', 'prizes')
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.warn('Error al obtener límites de premios:', error);
  }

  // Valores por defecto
  let limits = {
    max_roulette_prizes: 10,
    max_streak_prizes: 5
  };

  // Si existe la configuración, parsear el JSON
  if (data?.value) {
    try {
      const parsedLimits = JSON.parse(data.value);
      limits = {
        max_roulette_prizes: parsedLimits.max_roulette_prizes || 10,
        max_streak_prizes: parsedLimits.max_streak_prizes || 5
      };
    } catch (parseError) {
      console.warn('Error parsing prize_limits JSON:', parseError);
    }
  }

  return limits;
}

// Función auxiliar para contar premios activos por tipo
async function countActivePrizes(type: "roulette" | "streak") {
  const supabase = createAdminClient();
  
  const { count, error } = await supabase
    .from("prizes")
    .select("*", { count: "exact", head: true })
    .eq("type", type)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Error al contar premios activos: ${error.message}`);
  }

  return count || 0;
}

export async function createPrize(prize: CreatePrizeData) {
  const supabase = createAdminClient();

  // Validar límites de premios antes de crear
  const limits = await getPrizeLimitsFromDB();
  const currentCount = await countActivePrizes(prize.type);

  const maxAllowed = prize.type === "roulette" 
    ? limits.max_roulette_prizes 
    : limits.max_streak_prizes;

  if (currentCount >= maxAllowed) {
    throw new Error(
      `No se puede crear más premios de ${prize.type}. ` +
      `Límite actual: ${maxAllowed}. ` +
      `Premios activos: ${currentCount}. ` +
      `Desactiva algunos premios existentes o contacta al superadmin para aumentar el límite.`
    );
  }

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

  // Obtener el premio actual para validaciones
  const { data: currentPrize, error: fetchError } = await supabase
    .from("prizes")
    .select("type, is_active, streak_threshold")
    .eq("id", prizeId)
    .single();

  if (fetchError) {
    throw new Error(`Error al obtener el premio: ${fetchError.message}`);
  }

  // Validar duplicados de racha si se está cambiando el tipo o el threshold
  if (prize.type === "streak" || (currentPrize.type === "streak" && prize.streak_threshold !== undefined)) {
    const streakThreshold = prize.streak_threshold ?? currentPrize.streak_threshold;
    
    if (streakThreshold && streakThreshold > 0) {
      const { count: duplicates } = await supabase
        .from("prizes")
        .select("*", { count: "exact", head: true })
        .eq("type", "streak")
        .eq("streak_threshold", streakThreshold)
        .eq("is_active", true)
        .is("deleted_at", null)
        .neq("id", prizeId); // Excluir el premio actual

      if (duplicates && duplicates > 0) {
        throw new Error(
          `Ya existe un premio de racha activo para ${streakThreshold} check-ins consecutivos. ` +
          `No puede haber duplicados en la misma racha.`
        );
      }
    }
  }

  // Validar límites si se está cambiando el tipo de premio
  if (prize.type && prize.type !== currentPrize.type) {
    // Validar que el nuevo tipo sea válido
    if (prize.type !== "roulette" && prize.type !== "streak") {
      throw new Error(`Tipo de premio no válido: ${prize.type}`);
    }

    const limits = await getPrizeLimitsFromDB();
    const currentCount = await countActivePrizes(prize.type);

    const maxAllowed = prize.type === "roulette" 
      ? limits.max_roulette_prizes 
      : limits.max_streak_prizes;

    if (currentCount >= maxAllowed) {
      throw new Error(
        `No se puede cambiar a tipo ${prize.type}. ` +
        `Límite actual: ${maxAllowed}. ` +
        `Premios activos: ${currentCount}. ` +
        `Desactiva algunos premios existentes o contacta al superadmin para aumentar el límite.`
      );
    }
  }

  // Validar límites si se está intentando activar un premio
  if (prize.is_active === true && !currentPrize.is_active) {
    const prizeType = prize.type ?? currentPrize.type;
    
    // Validar que el tipo sea válido
    if (prizeType !== "roulette" && prizeType !== "streak") {
      throw new Error(`Tipo de premio no válido: ${prizeType}`);
    }

    const limits = await getPrizeLimitsFromDB();
    const currentCount = await countActivePrizes(prizeType);

    const maxAllowed = prizeType === "roulette" 
      ? limits.max_roulette_prizes 
      : limits.max_streak_prizes;

    if (currentCount >= maxAllowed) {
      throw new Error(
        `No se puede activar más premios de ${prizeType}. ` +
        `Límite actual: ${maxAllowed}. ` +
        `Premios activos: ${currentCount}. ` +
        `Desactiva algunos premios existentes o contacta al superadmin para aumentar el límite.`
      );
    }
  }

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

// Función para obtener estadísticas de premios y límites
export async function getPrizeStats() {
  // Obtener límites configurados
  const limits = await getPrizeLimitsFromDB();
  
  // Contar premios activos por tipo
  const [rouletteCount, streakCount] = await Promise.all([
    countActivePrizes("roulette"),
    countActivePrizes("streak")
  ]);
  
  return {
    roulette: {
      active: rouletteCount,
      limit: limits.max_roulette_prizes,
      canCreate: rouletteCount < limits.max_roulette_prizes
    },
    streak: {
      active: streakCount,
      limit: limits.max_streak_prizes,
      canCreate: streakCount < limits.max_streak_prizes
    }
  };
}
