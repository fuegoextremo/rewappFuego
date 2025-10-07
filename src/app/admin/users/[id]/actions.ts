"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

// Schema for the user update form - Admin puede asignar hasta admin, no superadmin
const updateUserSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  role: z.enum(["client", "verifier", "admin"]), // Limitado: sin superadmin
  branch_id: z.string().nullable().optional(), // Sucursal (solo para no-clientes)
});

// Schema for granting spins
const grantSpinsSchema = z.object({
  spinCount: z.number().min(1, "Debe ser al menos 1 giro").max(100, "No se pueden dar más de 100 giros a la vez"),
});

// Schema for granting a coupon
const grantCouponSchema = z.object({
  prizeId: z.string().uuid("Debe seleccionar un premio válido"),
  validityDays: z.number().min(1, "Debe ser al menos 1 día").max(365, "No puede exceder 365 días").optional(),
});

// Type for the RPC response
type GrantCouponResponse = {
  unique_code: string;
  id: string;
  expires_at: string;
} | null;

// Type for the action response
type GrantCouponResult = {
  error?: string;
  message?: string;
  data?: GrantCouponResponse;
};

export async function grantSpins(userId: string, spinCount: number) {
  const validatedFields = grantSpinsSchema.safeParse({ spinCount });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors.map(e => e.message).join(", "),
    };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc('increment_user_spins', {
    p_user_id: userId,
    p_spin_amount: validatedFields.data.spinCount,
  });

  if (error) {
    return {
      error: `Error al otorgar giros: ${error.message}`,
    };
  }

  revalidatePath(`/admin/users/${userId}`);

  return {
    message: `${validatedFields.data.spinCount} giros otorgados con éxito.`,
  };
}

export async function grantCoupon(userId: string, prizeId: string, validityDays?: number): Promise<GrantCouponResult> {
  try {
    console.log('Starting grantCoupon with:', { userId, prizeId, validityDays });
    
    const validatedFields = grantCouponSchema.safeParse({ prizeId, validityDays });

    if (!validatedFields.success) {
      console.log('Validation failed:', validatedFields.error);
      return {
        error: validatedFields.error.errors.map(e => e.message).join(", "),
      };
    }

    const supabase = createAdminClient();
    console.log('Calling RPC grant_manual_coupon with inventory control');

    try {
      // Llamar a la nueva función con control de inventario usando postgrest
      const { data, error } = await supabase.rpc('grant_manual_coupon', {
        p_user_id: userId,
        p_prize_id: prizeId,
        p_validity_days: validityDays || 30
      });

      if (error) {
        console.error('RPC error:', error);
        return {
          error: `Error al otorgar el cupón: ${error.message}`,
        };
      }

      // Verificar la respuesta de la nueva función
      console.log('Raw response from grant_manual_coupon:', data);
      
      if (data && (data as Record<string, unknown>).success) {
        const responseData = data as Record<string, unknown>;
        
        console.log('Coupon granted successfully with inventory control:', responseData);
        revalidatePath(`/admin/users/${userId}`);

        return {
          message: `Cupón otorgado con éxito (${(responseData as { stock_affected?: boolean }).stock_affected ? 'stock descontado' : 'stock ilimitado'}).`,
          data: {
            unique_code: (responseData as { unique_code: string }).unique_code,
            id: (responseData as { coupon_id: string }).coupon_id,
            expires_at: (responseData as { expires_at: string }).expires_at
          }
        };
      } else {
        return {
          error: "Error al generar el cupón con control de inventario",
        };
      }
    } catch (rpcError: unknown) {
      console.error('Exception calling grant_manual_coupon:', rpcError);
      const errorMessage = rpcError instanceof Error ? rpcError.message : 'Sin stock disponible';
      return {
        error: `Error de inventario: ${errorMessage}`,
      };
    }
  } catch (error) {
    console.error('Unexpected error in grantCoupon:', error);
    return {
      error: "Error inesperado al otorgar el cupón",
    };
  }
}

export async function updateUser(userId: string, formData: z.infer<typeof updateUserSchema>) {
  const validatedFields = updateUserSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: "Datos inválidos.",
    };
  }

  const supabase = createAdminClient();

  // Preparar datos de actualización
  const updateData: {
    first_name: string;
    last_name: string;
    phone?: string;
    birth_date?: string;
    role: "client" | "verifier" | "admin";
    branch_id?: string | null;
    updated_at: string;
  } = {
    first_name: validatedFields.data.first_name,
    last_name: validatedFields.data.last_name,
    phone: validatedFields.data.phone,
    birth_date: validatedFields.data.birth_date,
    role: validatedFields.data.role,
    updated_at: new Date().toISOString(),
  };

  // Si el rol es "client", asegurarse de que branch_id sea null
  // Si el rol no es "client", usar el branch_id proporcionado
  if (validatedFields.data.role === "client") {
    updateData.branch_id = null;
  } else if (validatedFields.data.branch_id === "none") {
    updateData.branch_id = null;
  } else if (validatedFields.data.branch_id) {
    updateData.branch_id = validatedFields.data.branch_id;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updateData)
    .eq("id", userId)
    .select();

  if (error) {
    return {
      error: `Error al actualizar el perfil: ${error.message}`,
    };
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");

  return {
    data,
    message: "Perfil actualizado con éxito.",
  };
}

export async function deleteCoupon(couponId: string, userId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId);

  if (error) {
    return {
      error: `Error al eliminar el cupón: ${error.message}`,
    };
  }

  revalidatePath(`/admin/users/${userId}`);

  return {
    message: "Cupón eliminado con éxito.",
  };
}

export async function deleteUser(userId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return {
      error: `Error al eliminar el usuario: ${error.message}`,
    };
  }

  // Redirect to the users list after deletion
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

// ============================================================
// PAGINATION ACTIONS
// ============================================================

// Tipos para las respuestas
export type CheckInWithDetails = {
  id: string
  user_id: string | null
  branch_id: string | null
  verified_by: string | null
  check_in_date: string | null
  spins_earned: number | null
  created_at: string | null
  updated_at: string | null
  branches: { name: string } | null
  user_profiles: { first_name: string | null; last_name: string | null } | null
}

export type CouponWithDetails = {
  id: string
  user_id: string | null
  prize_id: string | null
  branch_id: string | null
  unique_code: string | null
  is_redeemed: boolean | null
  redeemed_at: string | null
  redeemed_by: string | null
  created_at: string | null
  expires_at: string | null
  updated_at: string | null
  source: string | null
  stock_recovered: boolean | null
  prizes: { name: string; description: string | null } | null
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
}

/**
 * Server action para obtener check-ins paginados de un usuario
 */
export async function getCheckinsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<CheckInWithDetails>> {
  try {
    const supabase = createAdminClient()

    // Calcular el rango para la paginación
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    // Query con paginación y count
    const { data, error, count } = await supabase
      .from("check_ins")
      .select(
        `
        *,
        branches(name),
        user_profiles!check_ins_verified_by_fkey(first_name, last_name)
      `,
        { count: 'exact' }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      console.error('Error fetching paginated check-ins:', error)
      return { data: [], total: 0 }
    }

    return {
      data: (data || []) as CheckInWithDetails[],
      total: count || 0
    }
  } catch (error) {
    console.error('Unexpected error in getCheckinsPaginated:', error)
    return { data: [], total: 0 }
  }
}

/**
 * Server action para obtener cupones paginados de un usuario
 */
export async function getCouponsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<CouponWithDetails>> {
  try {
    const supabase = createAdminClient()

    // Calcular el rango para la paginación
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    // Query con paginación y count
    const { data, error, count } = await supabase
      .from("coupons")
      .select(
        `
        *,
        prizes(name, description)
      `,
        { count: 'exact' }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      console.error('Error fetching paginated coupons:', error)
      return { data: [], total: 0 }
    }

    return {
      data: (data || []) as CouponWithDetails[],
      total: count || 0
    }
  } catch (error) {
    console.error('Unexpected error in getCouponsPaginated:', error)
    return { data: [], total: 0 }
  }
}