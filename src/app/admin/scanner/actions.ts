"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createActionClient } from "@/lib/supabase/actions";
import { verifyToken, RedeemPayload, normalizeScannedQrInput, isUuid } from "@/lib/utils/qr";
import { revalidatePath } from "next/cache";
import { invalidateScanActivityCache } from "./queries";

export type ActionResponse = {
  success: boolean;
  message: string;
  resultType?: 'checkin' | 'redeem';
};

export async function processScannedQr(scannedValue: string): Promise<ActionResponse> {
  const normalizedToken = normalizeScannedQrInput(scannedValue);
  const payload: RedeemPayload | null = verifyToken(normalizedToken);

  if (!payload) {
    return { success: false, message: "Código QR inválido o expirado." };
  }

  // Ruta principal para tokens nuevos con tipo explícito.
  if (payload.kind === 'checkin') {
    return processCheckin(normalizedToken);
  }
  if (payload.kind === 'redeem') {
    return redeemCoupon(normalizedToken);
  }

  // Compatibilidad con tokens legacy sin 'kind':
  // - c UUID => cupón (canje)
  // - c no UUID => check-in
  if (isUuid(payload.c)) {
    return redeemCoupon(normalizedToken);
  }

  return processCheckin(normalizedToken);
}

export async function processCheckin(qrToken: string): Promise<ActionResponse> {
  const normalizedToken = normalizeScannedQrInput(qrToken);
  const supabase = createActionClient();
  const adminSupabase = createAdminClient();

  // 1. Obtener el verificador y su sucursal
  const { data: { user: verifierUser } } = await supabase.auth.getUser();
  if (!verifierUser) {
    return { success: false, message: "No autorizado. Inicia sesión de nuevo.", resultType: 'checkin' };
  }

  const { data: verifierProfile } = await adminSupabase
    .from('user_profiles')
    .select('branch_id')
    .eq('id', verifierUser.id)
    .single();

  if (!verifierProfile || !verifierProfile.branch_id) {
    return { success: false, message: "No se pudo determinar la sucursal del verificador.", resultType: 'checkin' };
  }
  const branchId = verifierProfile.branch_id;

  // 2. Validar el token del cliente
  const payload: RedeemPayload | null = verifyToken(normalizedToken);
  if (!payload) {
    return { success: false, message: "Código QR de cliente inválido o expirado.", resultType: 'checkin' };
  }

  if (payload.kind === 'redeem') {
    return { success: false, message: "Este QR corresponde a un canje de premio, no a check-in.", resultType: 'checkin' };
  }

  const customerUserId = payload.u;

  // 3. Ejecutar el check-in (ahora usa configuraciones dinámicas internamente)
  const { error } = await supabase.rpc('process_checkin', {
    p_user: customerUserId,
    p_branch: branchId
    // Ya no necesitamos p_spins porque la función usa la configuración dinámica
  });

  if (error) {
    // Personalizar mensaje de error
    if (error.message.includes('límite de check-ins diarios')) {
      return { success: false, message: "Has alcanzado el límite de check-ins diarios.", resultType: 'checkin' };
    }
    if (error.message.includes('ya realizó check-in hoy')) {
      return { success: false, message: "Ya tienes un check-in registrado hoy.", resultType: 'checkin' };
    }
    return { success: false, message: `Error en el check-in: ${error.message}`, resultType: 'checkin' };
  }

  // Invalidar caché del dashboard y de actividad reciente
  revalidatePath('/admin/dashboard');
  await invalidateScanActivityCache();

  return { success: true, message: "Check-in exitoso. Puntos otorgados según configuración!", resultType: 'checkin' };
}

export async function redeemCoupon(qrToken: string): Promise<ActionResponse> {
  try {
    const normalizedToken = normalizeScannedQrInput(qrToken);

    const payload = verifyToken(normalizedToken);
    if (!payload) {
      return { success: false, message: "Código QR inválido o expirado.", resultType: 'redeem' };
    }

    if (payload.kind === 'checkin') {
      return { success: false, message: "Este QR corresponde a check-in, no a canje.", resultType: 'redeem' };
    }

    const adminSupabase = createAdminClient();
    const { data: { user: verifierUser } } = await createActionClient().auth.getUser();

    if (!verifierUser) {
      return { success: false, message: "No autorizado. Inicia sesión de nuevo.", resultType: 'redeem' };
    }

    // Round-trip 1: verificar rol y branch del verificador
    const { data: verifierProfile } = await adminSupabase
      .from('user_profiles')
      .select('role, branch_id')
      .eq('id', verifierUser.id)
      .single();

    if (!verifierProfile || !['verifier', 'manager', 'admin', 'superadmin'].includes(verifierProfile.role || '')) {
      return { success: false, message: "Sin permisos para canjear cupones.", resultType: 'redeem' };
    }

    // Round-trip 2: verificar cupón (incluye prize info — elimina el 3er SELECT original)
    const { data: coupon, error: couponError } = await adminSupabase
      .from('coupons')
      .select('id, user_id, is_redeemed, expires_at, prizes(name, type)')
      .eq('id', payload.c)
      .single();

    if (couponError || !coupon) {
      return { success: false, message: "Cupón no encontrado.", resultType: 'redeem' };
    }

    if (coupon.is_redeemed) {
      return { success: false, message: "Este cupón ya ha sido redimido.", resultType: 'redeem' };
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return { success: false, message: "Este cupón ha expirado.", resultType: 'redeem' };
    }

    // Round-trip 3: UPDATE atómico — incluye branch_id para reportes correctos
    const { data: updatedCoupon, error: updateError } = await adminSupabase
      .from('coupons')
      .update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString(),
        redeemed_by: verifierUser.id,
        branch_id: verifierProfile.branch_id,
      })
      .eq('id', payload.c)
      .eq('is_redeemed', false)
      .select('id')
      .maybeSingle();

    if (updateError) {
      return { success: false, message: `Error al redimir cupón: ${updateError.message}`, resultType: 'redeem' };
    }

    if (!updatedCoupon) {
      return { success: false, message: "Este cupón ya fue redimido por otro verificador.", resultType: 'redeem' };
    }

    const prizeName = coupon.prizes?.name || 'Premio';

    revalidatePath('/admin/dashboard');
    await invalidateScanActivityCache();

    return { success: true, message: `Cupón "${prizeName}" redimido exitosamente.`, resultType: 'redeem' };

  } catch (error) {
    console.error('Error in redeemCoupon:', error);
    return { success: false, message: "Error interno del servidor.", resultType: 'redeem' };
  }
}
