"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClientServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Tipos para las configuraciones
export type SystemSettingCategory = 'general' | 'notifications' | 'prizes' | 'coupons';

export type SystemSetting = {
  id: string;
  key: string;
  value: string;
  category: SystemSettingCategory;
  description: string | null;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'text';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type SystemSettingsUpdate = Record<string, string | number | boolean>;

// Verificar permisos de admin
async function verifyAdminPermissions() {
  const supabaseServer = createClientServer();
  const { data: user, error: userError } = await supabaseServer.auth.getUser();
  
  if (userError || !user?.user) {
    throw new Error('Usuario no autenticado');
  }

  const supabaseAdmin = createAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  if (profileError || !profile || !['admin', 'superadmin'].includes(profile.role || '')) {
    throw new Error('Permisos insuficientes. Solo admins pueden gestionar configuraciones.');
  }

  return { supabase: supabaseAdmin, user: user.user, role: profile.role };
}

// Obtener configuraciones para Admin (notifications + general)
export async function getAdminSettings() {
  try {
    const { supabase, role } = await verifyAdminPermissions();

    if (!role || !['admin', 'superadmin'].includes(role)) {
      throw new Error('Permisos insuficientes');
    }

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .in('category', ['notifications', 'general']) // Admin puede ver notificaciones y empresa
      .eq('is_active', true)
      .order('category, key');

    if (error) {
      throw new Error(`Error al obtener configuraciones: ${error.message}`);
    }

    // Agrupar por categoría
    const groupedSettings = (data as SystemSetting[]).reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<SystemSettingCategory, SystemSetting[]>);

    return { success: true, data: groupedSettings };
  } catch (error) {
    console.error('Error in getAdminSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: {}
    };
  }
}

// Actualizar configuraciones del sistema
export async function updateSystemSettings(updates: SystemSettingsUpdate) {
  try {
    const { supabase, user, role } = await verifyAdminPermissions();

    // Obtener las configuraciones actuales para validar permisos
    const keys = Object.keys(updates);
    const { data: currentSettings, error: fetchError } = await supabase
      .from('system_settings')
      .select('key, category')
      .in('key', keys)
      .eq('is_active', true);

    if (fetchError) {
      throw new Error(`Error al verificar configuraciones: ${fetchError.message}`);
    }

    // Validar permisos por categoría (admin solo puede modificar notifications y general)
    for (const setting of currentSettings || []) {
      if (role === 'admin' && !['notifications', 'general'].includes(setting.category)) {
        throw new Error(`Sin permisos para modificar configuraciones de ${setting.category}`);
      }
    }

    // Actualizar cada configuración
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      return supabase
        .from('system_settings')
        .update({
          value: String(value),
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .eq('is_active', true);
    });

    const results = await Promise.all(updatePromises);

    // Verificar errores
    for (const result of results) {
      if (result.error) {
        throw new Error(`Error al actualizar configuración: ${result.error.message}`);
      }
    }

    revalidatePath('/admin/settings');
    return { 
      success: true, 
      message: `${keys.length} configuración(es) actualizada(s) exitosamente` 
    };
  } catch (error) {
    console.error('Error in updateSystemSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Obtener límites de premios (solo superadmin)
export async function getPrizeLimits() {
  try {
    const { supabase, role } = await verifyAdminPermissions();

    // Solo superadmin puede ver límites de premios
    if (role !== 'superadmin') {
      throw new Error('Solo superadmins pueden acceder a límites de premios');
    }

    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'prize_limits')
      .eq('category', 'prizes')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Error al obtener límites: ${error.message}`);
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

    return { success: true, data: limits };
  } catch (error) {
    console.error('Error in getPrizeLimits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: { max_roulette_prizes: 10, max_streak_prizes: 5 }
    };
  }
}

// Actualizar límites de premios (solo superadmin)
export async function updatePrizeLimits(maxRoulettePrizes: number, maxStreakPrizes: number) {
  try {
    const { supabase, user, role } = await verifyAdminPermissions();

    // Solo superadmin puede modificar límites de premios
    if (role !== 'superadmin') {
      throw new Error('Solo superadmins pueden modificar límites de premios');
    }

    const limitsJson = JSON.stringify({
      max_roulette_prizes: maxRoulettePrizes,
      max_streak_prizes: maxStreakPrizes
    });

    // Insertar o actualizar la configuración como JSON
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'prize_limits',
        value: limitsJson,
        category: 'prizes',
        setting_type: 'json',
        description: 'Límites máximos de premios activos simultáneamente',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'key'
      });

    if (error) {
      throw new Error(`Error al actualizar límites: ${error.message}`);
    }

    revalidatePath('/admin/settings');
    return { 
      success: true, 
      message: 'Límites de premios actualizados exitosamente' 
    };
  } catch (error) {
    console.error('Error in updatePrizeLimits:', error);
    throw error;
  }
}

// Resetear configuraciones a valores por defecto
export async function resetSettingsToDefault(category: SystemSettingCategory) {
  try {
    const { supabase, role } = await verifyAdminPermissions();

    if (role === 'admin' && !['notifications', 'general'].includes(category)) {
      throw new Error('Sin permisos para resetear esta categoría');
    }

    // Valores por defecto para las categorías que admin puede gestionar
    const defaultValues: Record<string, string> = {
      // Notificaciones y Check-ins
      'checkin_points_daily': '10',
      'max_checkins_per_day': '1',
      'streak_break_days': '12',
      'streak_expiry_days': '90',
      
      // Empresa
      'company_name': 'Mi Empresa',
      'company_logo_url': '',
      'company_theme_primary': '#8b5cf6',
      'company_theme_secondary': '#a855f7',
      'company_contact_email': '',
      'company_contact_phone': '',
      'company_address': '',
      'company_terms_conditions': 'Términos y condiciones por definir...',
      'company_privacy_policy': 'Política de privacidad por definir...',
    };

    // Obtener configuraciones de la categoría
    const { data: settings, error: fetchError } = await supabase
      .from('system_settings')
      .select('key')
      .eq('category', category)
      .eq('is_active', true);

    if (fetchError) {
      throw new Error(`Error al obtener configuraciones: ${fetchError.message}`);
    }

    // Resetear cada configuración a su valor por defecto
    const resetPromises = (settings || []).map(setting => {
      const defaultValue = defaultValues[setting.key] || '';
      return supabase
        .from('system_settings')
        .update({
          value: defaultValue,
          updated_at: new Date().toISOString()
        })
        .eq('key', setting.key)
        .eq('category', category)
        .eq('is_active', true);
    });

    await Promise.all(resetPromises);

    revalidatePath('/admin/settings');
    return { 
      success: true, 
      message: `Configuraciones de ${category} reseteadas a valores por defecto` 
    };
  } catch (error) {
    console.error('Error in resetSettingsToDefault:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
