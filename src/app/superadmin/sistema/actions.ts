"use server";

import { createClientServer } from "@/lib/supabase/server";

// Tipos para las configuraciones
export type SystemSettingCategory = 'prizes' | 'coupons' | 'general' | 'notifications';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  setting_type: string;
  category: SystemSettingCategory;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface SystemSettingsUpdate {
  [key: string]: string | number | boolean;
}

// Verificar permisos de administrador
async function verifyAdminPermissions() {
  const supabase = createClientServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('No autenticado');
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Perfil no encontrado');
  }

  if (!profile.role || !['admin', 'superadmin'].includes(profile.role)) {
    throw new Error('Permisos insuficientes');
  }

  return { supabase, user, role: profile.role };
}

// Obtener todas las configuraciones por categoría
export async function getSystemSettings(category?: SystemSettingCategory) {
  try {
    const { supabase } = await verifyAdminPermissions();

    let query = supabase
      .from('system_settings')
      .select('*')
      .eq('is_active', true)
      .order('key');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener configuraciones: ${error.message}`);
    }

    return { success: true, data: data as SystemSetting[] };
  } catch (error) {
    console.error('Error in getSystemSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    };
  }
}

// Obtener una configuración específica
export async function getSystemSetting(key: string) {
  try {
    const { supabase } = await verifyAdminPermissions();

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error(`Error al obtener configuración: ${error.message}`);
    }

    return { success: true, data: data as SystemSetting };
  } catch (error) {
    console.error('Error in getSystemSetting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: null
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

    // Validar permisos por categoría
    for (const setting of currentSettings || []) {
      if (role === 'admin' && setting.category !== 'notifications') {
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

// Obtener configuraciones para SuperAdmin (todas las categorías)
export async function getSuperAdminSettings() {
  try {
    const { supabase, role } = await verifyAdminPermissions();

    if (role !== 'superadmin') {
      throw new Error('Solo superadmins pueden acceder a estas configuraciones');
    }

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('is_active', true)
      .in('category', ['prizes', 'coupons', 'general', 'notifications'])
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
    console.error('Error in getSuperAdminSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: {}
    };
  }
}

// Obtener configuraciones para Admin (solo notifications)
export async function getAdminSettings() {
  try {
    const { supabase, role } = await verifyAdminPermissions();

    if (!role || !['admin', 'superadmin'].includes(role)) {
      throw new Error('Permisos insuficientes');
    }

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', 'notifications')
      .eq('is_active', true)
      .order('key');

    if (error) {
      throw new Error(`Error al obtener configuraciones: ${error.message}`);
    }

    return { success: true, data: data as SystemSetting[] };
  } catch (error) {
    console.error('Error in getAdminSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    };
  }
}

// Resetear configuraciones a valores por defecto
export async function resetSettingsToDefault(category: SystemSettingCategory) {
  try {
    const { supabase, role } = await verifyAdminPermissions();

    if (role === 'admin' && category !== 'notifications') {
      throw new Error('Sin permisos para resetear esta categoría');
    }

    // Valores por defecto
    const defaultValues: Record<string, string> = {
      // Prizes
      'max_prizes_per_company': '50',
      'roulette_win_percentage': '15',
      'spin_cooldown_seconds': '30',
      // Coupons
      'default_coupon_expiry_days': '30',
      // Notifications
      'checkin_points_daily': '10',
      'max_checkins_per_day': '1',
      // General
      'company_name': 'Mi Empresa',
      'company_logo_url': '',
      'company_theme_primary': '#8b5cf6',
      'company_theme_secondary': '#a855f7',
      'company_contact_email': '',
      'company_contact_phone': '',
      'company_address': '',
      'company_terms_conditions': 'Términos y condiciones por definir...',
      'company_privacy_policy': 'Política de privacidad por definir...'
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

    // Resetear cada configuración
    const resetPromises = (settings || []).map((setting: { key: string }) => {
      const defaultValue = defaultValues[setting.key];
      if (defaultValue !== undefined) {
        return supabase
          .from('system_settings')
          .update({
            value: defaultValue,
            updated_at: new Date().toISOString()
          })
          .eq('key', setting.key)
          .eq('is_active', true);
      }
      return Promise.resolve({ error: null });
    });

    const results = await Promise.all(resetPromises);

    // Verificar errores
    for (const result of results) {
      if (result.error) {
        throw new Error(`Error al resetear configuración: ${result.error.message}`);
      }
    }

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
