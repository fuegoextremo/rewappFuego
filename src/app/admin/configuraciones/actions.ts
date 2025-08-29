"use server";

import { createClientServer } from "@/lib/supabase/server";

// Reutilizar funciones principales pero con validación de permisos Admin
export { 
  updateSystemSettings, 
  resetSettingsToDefault, 
  getAdminSettings 
} from "@/app/superadmin/sistema/actions";

// Función específica para obtener solo configuraciones de notificaciones para Admin
export async function getAdminNotificationSettings() {
  try {
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

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', 'notifications')
      .eq('is_active', true)
      .order('key');

    if (error) {
      throw new Error(`Error al obtener configuraciones: ${error.message}`);
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getAdminNotificationSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    };
  }
}
