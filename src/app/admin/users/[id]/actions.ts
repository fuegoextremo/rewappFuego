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
    console.log('Calling RPC grant_coupon_to_user');

    const { data, error } = await supabase.rpc('grant_coupon_to_user', {
      p_user_id: userId,
      p_prize_id: prizeId,
      p_validity_days: validityDays
    });

    if (error) {
      console.error('RPC error:', error);
      return {
        error: `Error al otorgar el cupón: ${error.message}`,
      };
    }

    console.log('Coupon granted successfully:', data);
    revalidatePath(`/admin/users/${userId}`);

    return {
      message: "Cupón otorgado con éxito.",
      data
    };
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

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      first_name: validatedFields.data.first_name,
      last_name: validatedFields.data.last_name,
      phone: validatedFields.data.phone,
      birth_date: validatedFields.data.birth_date,
      role: validatedFields.data.role,
      updated_at: new Date().toISOString(),
    })
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