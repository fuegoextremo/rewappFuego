"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClientServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Tipos para la gestión de usuarios
export interface UserWithProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string | null;
  is_active: boolean | null;
  branch_id: string | null;
  created_at: string | null;
  branch_name?: string | null;
  last_checkin?: string | null;
  total_checkins?: number;
  total_spins?: number;
  available_spins?: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'user' | 'verifier' | 'admin' | 'superadmin';
  branch_id?: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: 'user' | 'verifier' | 'admin' | 'superadmin';
  branch_id?: string;
  is_active?: boolean;
}

// Verificar permisos de superadmin
async function verifySupaAdminPermissions() {
  // Usar el cliente del servidor para obtener el usuario actual
  const supabaseServer = createClientServer();
  const { data: user, error: userError } = await supabaseServer.auth.getUser();
  
  if (userError || !user?.user) {
    throw new Error('Usuario no autenticado');
  }

  // Usar el cliente admin para operaciones administrativas
  const supabaseAdmin = createAdminClient();

  // Verificar que el usuario es superadmin
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.user.id)
    .single();

  if (profileError || profile?.role !== 'superadmin') {
    throw new Error('Permisos insuficientes. Solo superadmins pueden gestionar usuarios.');
  }

  return { supabase: supabaseAdmin, user: user.user };
}

// Obtener todos los usuarios con información extendida
export async function getAllUsers() {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        role,
        is_active,
        branch_id,
        created_at,
        branches:branch_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }

    // Obtener información de autenticación y estadísticas de cada usuario
    const usersWithAuth = await Promise.all(
      (users || []).map(async (user) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
        
        // Obtener estadísticas de check-ins
        const { count: checkinCount } = await supabase
          .from('check_ins')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Obtener giros disponibles
        const { data: spinsData } = await supabase
          .from('user_spins')
          .select('available_spins')
          .eq('user_id', user.id)
          .maybeSingle();
        
        return {
          id: user.id,
          email: authUser?.user?.email || '',
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: user.role,
          is_active: user.is_active,
          branch_id: user.branch_id,
          created_at: user.created_at,
          branch_name: user.branches?.name || null,
          total_checkins: checkinCount || 0,
          available_spins: spinsData?.available_spins || 0,
        } as UserWithProfile;
      })
    );

    return { success: true, data: usersWithAuth };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Crear nuevo usuario
export async function createUser(userData: CreateUserData) {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    // Crear usuario en Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true // Auto-confirmar email para usuarios creados por admin
    });

    if (authError || !authUser.user) {
      throw new Error(`Error al crear usuario en Auth: ${authError?.message}`);
    }

    // Crear perfil de usuario
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || null,
        role: userData.role,
        branch_id: userData.branch_id || null,
        is_active: userData.is_active ?? true,
      });

    if (profileError) {
      // Si falla el perfil, eliminar el usuario de Auth
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    // Crear registro de spins si es necesario
    if (userData.role === 'user') {
      await supabase
        .from('user_spins')
        .insert({
          user_id: authUser.user.id,
          available_spins: 0
        });
    }

    revalidatePath('/superadmin/users');
    return { success: true, message: 'Usuario creado exitosamente' };
  } catch (error) {
    console.error('Error in createUser:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Actualizar usuario
export async function updateUser(userId: string, userData: UpdateUserData) {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        role: userData.role,
        branch_id: userData.branch_id,
        is_active: userData.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }

    revalidatePath('/superadmin/users');
    return { success: true, message: 'Usuario actualizado exitosamente' };
  } catch (error) {
    console.error('Error in updateUser:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Activar/Desactivar usuario
export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_active: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al cambiar estado del usuario: ${error.message}`);
    }

    revalidatePath('/superadmin/users');
    return { 
      success: true, 
      message: `Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente` 
    };
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Eliminar usuario (soft delete)
export async function deleteUser(userId: string) {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    // Soft delete: marcar como inactivo en lugar de eliminar
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }

    revalidatePath('/superadmin/users');
    return { success: true, message: 'Usuario eliminado exitosamente' };
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Resetear contraseña de usuario
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      throw new Error(`Error al resetear contraseña: ${error.message}`);
    }

    return { success: true, message: 'Contraseña reseteada exitosamente' };
  } catch (error) {
    console.error('Error in resetUserPassword:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Otorgar giros a usuario
export async function grantSpinsToUser(userId: string, spins: number) {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    const { error } = await supabase.rpc('increment_user_spins', {
      p_user_id: userId,
      p_spin_amount: spins
    });

    if (error) {
      throw new Error(`Error al otorgar giros: ${error.message}`);
    }

    revalidatePath('/superadmin/users');
    return { success: true, message: `${spins} giros otorgados exitosamente` };
  } catch (error) {
    console.error('Error in grantSpinsToUser:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
