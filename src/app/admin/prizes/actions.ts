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

// ============================================
// FUNCIONES DE RECUPERACIÓN DE STOCK
// ============================================

export type StockRecoveryPreview = {
  prize_id: string;
  prize_name: string;
  current_stock: number;
  expired_coupons: number;
  stock_after_recovery: number;
};

export async function getStockRecoveryPreview(): Promise<StockRecoveryPreview[]> {
  const supabase = createAdminClient();
  
  // Query para obtener premios con cupones expirados no recuperados
  const { data: prizes, error } = await supabase
    .from('prizes')
    .select(`
      id,
      name,
      inventory_count
    `)
    .eq('type', 'roulette')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error getting prizes:', error);
    return [];
  }
  
  if (!prizes) return [];
  
  const result: StockRecoveryPreview[] = [];
  
  // Para cada premio, contar cupones expirados no recuperados
  for (const prize of prizes) {
    const { count, error: countError } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('prize_id', prize.id)
      .eq('is_redeemed', false)
      .eq('stock_recovered', false)  // Solo cupones no recuperados
      .lt('expires_at', new Date().toISOString());
    
    if (countError) {
      console.error(`Error counting expired coupons for prize ${prize.id}:`, countError);
      continue;
    }
    
    const expiredCount = count || 0;
    
    if (expiredCount > 0) {
      result.push({
        prize_id: prize.id,
        prize_name: prize.name,
        current_stock: prize.inventory_count || 0,
        expired_coupons: expiredCount,
        stock_after_recovery: (prize.inventory_count || 0) + expiredCount
      });
    }
  }
  
  return result;
}

export async function recoverExpiredStock() {
  const supabase = createAdminClient();
  
  try {
    // Obtener cupones expirados no recuperados para recuperar stock
    const { data: expiredCoupons, error: fetchError } = await supabase
      .from('coupons')
      .select(`
        id,
        prize_id,
        prizes!inner(name, type, inventory_count)
      `)
      .eq('is_redeemed', false)
      .eq('stock_recovered', false)  // Solo cupones no recuperados
      .eq('prizes.type', 'roulette')
      .lt('expires_at', new Date().toISOString());
    
    if (fetchError) {
      return {
        success: false,
        message: `Error al obtener cupones expirados: ${fetchError.message}`
      };
    }
    
    if (!expiredCoupons || expiredCoupons.length === 0) {
      return {
        success: true,
        message: 'No hay stock para recuperar de cupones expirados',
        total_recovered: 0
      };
    }
    
    // Agrupar por premio para actualizar stock
    const prizeUpdates = expiredCoupons.reduce((acc: Record<string, number>, coupon) => {
      if (coupon.prize_id) {
        acc[coupon.prize_id] = (acc[coupon.prize_id] || 0) + 1;
      }
      return acc;
    }, {});
    
    let totalRecovered = 0;
    
    // Actualizar stock de cada premio
    for (const [prizeId, count] of Object.entries(prizeUpdates)) {
      // Obtener stock actual
      const { data: currentPrize, error: getCurrentError } = await supabase
        .from('prizes')
        .select('inventory_count')
        .eq('id', prizeId)
        .single();
      
      if (getCurrentError || !currentPrize) {
        console.error(`Error getting current prize ${prizeId}:`, getCurrentError);
        continue;
      }
      
      const newStock = (currentPrize.inventory_count || 0) + count;
      
      const { error: updateError } = await supabase
        .from('prizes')
        .update({ 
          inventory_count: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', prizeId);
      
      if (updateError) {
        console.error(`Error updating prize ${prizeId}:`, updateError);
        continue;
      }
      
      totalRecovered += count;
    }
    
    // Marcar cupones como stock recuperado (NO eliminar - mantener para analytics)
    const couponIds = expiredCoupons.map(c => c.id);
    const { error: markError } = await supabase
      .from('coupons')
      .update({ 
        stock_recovered: true,
        updated_at: new Date().toISOString()
      })
      .in('id', couponIds);
    
    if (markError) {
      console.error('Error marking coupons as recovered:', markError);
      // No fallar aquí, el stock ya se recuperó
    }
    
    // Revalidar la página para mostrar los cambios
    revalidatePath('/admin/prizes');
    
    return {
      success: true,
      message: `Se recuperaron ${totalRecovered} unidades de stock. Los cupones se mantuvieron para analytics.`,
      total_recovered: totalRecovered
    };
  } catch (error) {
    console.error('Error in recoverExpiredStock:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
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
