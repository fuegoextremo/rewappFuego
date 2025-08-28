"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createActionClient } from "@/lib/supabase/actions";
import { verifyToken, RedeemPayload } from "@/lib/utils/qr";

export type ActionResponse = {
  success: boolean;
  message: string;
};

export async function processCheckin(qrToken: string): Promise<ActionResponse> {
  const supabase = createActionClient();
  const adminSupabase = createAdminClient();

  // 1. Obtener el verificador y su sucursal
  const { data: { user: verifierUser } } = await supabase.auth.getUser();
  if (!verifierUser) {
    return { success: false, message: "No autorizado. Inicia sesión de nuevo." };
  }

  const { data: verifierProfile } = await adminSupabase
    .from('user_profiles')
    .select('branch_id')
    .eq('id', verifierUser.id)
    .single();

  if (!verifierProfile || !verifierProfile.branch_id) {
    return { success: false, message: "No se pudo determinar la sucursal del verificador." };
  }
  const branchId = verifierProfile.branch_id;

  // 2. Validar el token del cliente
  const payload: RedeemPayload | null = verifyToken(qrToken);
  if (!payload) {
    return { success: false, message: "Código QR de cliente inválido o expirado." };
  }
  const customerUserId = payload.u;

  // 3. Ejecutar el check-in
  const { error } = await supabase.rpc('process_checkin', {
    p_user: customerUserId,
    p_branch: branchId,
    p_spins: 1 // Otorgar 1 spin por check-in
  });

  if (error) {
    // Personalizar mensaje de error para el caso de check-in ya realizado
    if (error.message.includes('checkin_time_constraint')) {
        return { success: false, message: "Este usuario ya ha hecho check-in recientemente." };
    }
    return { success: false, message: `Error en el check-in: ${error.message}` };
  }

  return { success: true, message: "Check-in exitoso." };
}

export async function redeemCoupon(qrToken: string): Promise<ActionResponse> {
  try {
    // Si es una URL completa, extraer solo el token
    if (qrToken.startsWith('http')) {
      const url = new URL(qrToken);
      qrToken = url.searchParams.get('t') || qrToken;
    }

    const payload = verifyToken(qrToken);
    if (!payload) {
      return { success: false, message: "Código QR inválido o expirado." };
    }

    const supabase = createAdminClient();
    const { data: { user: verifierUser } } = await createActionClient().auth.getUser();
    
    if (!verifierUser) {
      return { success: false, message: "No autorizado. Inicia sesión de nuevo." };
    }

    // Verificar que el cupón existe y no ha sido redimido
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id, user_id, is_redeemed, expires_at')
      .eq('id', payload.c)
      .single();

    if (couponError || !coupon) {
      return { success: false, message: "Cupón no encontrado." };
    }

    if (coupon.is_redeemed) {
      return { success: false, message: "Este cupón ya ha sido redimido." };
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return { success: false, message: "Este cupón ha expirado." };
    }

    // Marcar cupón como redimido
    const { error: updateError } = await supabase
      .from('coupons')
      .update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString(),
        redeemed_by: verifierUser.id
      })
      .eq('id', payload.c);

    if (updateError) {
      return { success: false, message: `Error al redimir cupón: ${updateError.message}` };
    }

    return { success: true, message: "Cupón redimido exitosamente." };

  } catch (error) {
    console.error('Error in redeemCoupon:', error);
    return { success: false, message: "Error interno del servidor." };
  }
}
