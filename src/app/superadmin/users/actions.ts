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
  role: 'client' | 'verifier' | 'admin' | 'superadmin';
  branch_id?: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: 'client' | 'verifier' | 'admin' | 'superadmin';
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

    // Verificar si ya existe un usuario con este email
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const userExists = existingAuthUser.users.some(user => user.email === userData.email);
    
    if (userExists) {
      throw new Error(`Ya existe un usuario con el email: ${userData.email}`);
    }

    // Crear usuario en Auth con metadatos para el trigger
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirmar email para usuarios creados por admin
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });

    if (authError || !authUser.user) {
      throw new Error(`Error al crear usuario en Auth: ${authError?.message}`);
    }

    const actualUserId = authUser.user.id;
    console.log(`Auth user created with ID: ${actualUserId}`);

    // El trigger automáticamente crea el perfil básico
    // Actualizamos directamente con los datos completos del formulario
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || null,
        role: userData.role,
        branch_id: userData.branch_id || null,
        is_active: userData.is_active ?? true,
      })
      .eq('id', actualUserId);

    if (profileUpdateError) {
      console.error('Error updating profile created by trigger:', profileUpdateError);
      try {
        await supabase.auth.admin.deleteUser(actualUserId);
        console.log('Successfully cleaned up auth user after profile update failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      throw new Error(`Error al actualizar perfil: ${profileUpdateError.message}`);
    }

    console.log(`Profile updated successfully for user ${actualUserId}`);

    // Actualizar el perfil creado automáticamente por el trigger
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || null,
        role: userData.role,
        branch_id: userData.branch_id || null,
        is_active: userData.is_active ?? true,
      })
      .eq('id', actualUserId);

    if (updateError) {
      // Si falla la actualización, eliminar el usuario de Auth
      console.error('Error updating profile, attempting to clean up auth user:', updateError);
      try {
        await supabase.auth.admin.deleteUser(actualUserId);
        console.log('Successfully cleaned up auth user after profile update failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      throw new Error(`Error al actualizar perfil: ${updateError.message}`);
    }

    // Crear registro de spins si es necesario
    if (userData.role === 'client') {
      const { error: spinsError } = await supabase
        .from('user_spins')
        .insert({
          user_id: actualUserId,
          available_spins: 0
        });
      
      if (spinsError) {
        console.error('Error creating user_spins, but user was created successfully:', spinsError);
        // No lanzar error aquí, ya que el usuario principal se creó correctamente
      }
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

// Función para limpiar usuarios huérfanos (usuarios en Auth sin perfil)
export async function cleanupOrphanedUsers() {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    // Obtener todos los usuarios de Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    // Obtener todos los perfiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id');

    const profileIds = new Set(profiles?.map(p => p.id) || []);
    
    // Encontrar usuarios de Auth sin perfil
    const orphanedUsers = authUsers.users.filter(user => !profileIds.has(user.id));
    
    console.log(`Found ${orphanedUsers.length} orphaned users`);
    
    // Eliminar usuarios huérfanos
    const cleanupResults = [];
    for (const user of orphanedUsers) {
      try {
        await supabase.auth.admin.deleteUser(user.id);
        cleanupResults.push({ id: user.id, email: user.email, status: 'deleted' });
        console.log(`Cleaned up orphaned user: ${user.email}`);
      } catch (error) {
        cleanupResults.push({ id: user.id, email: user.email, status: 'error', error });
        console.error(`Failed to cleanup user ${user.email}:`, error);
      }
    }

    return { success: true, cleanedUp: cleanupResults };
  } catch (error) {
    console.error('Error in cleanupOrphanedUsers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función para limpiar perfiles huérfanos (perfiles en BD sin usuario de Auth)
export async function cleanupOrphanedProfiles() {
  try {
    const { supabase } = await verifySupaAdminPermissions();

    // Obtener todos los perfiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role');

    if (!profiles) {
      return { success: true, cleanedUp: [] };
    }

    // Verificar cuáles tienen usuario de Auth
    const cleanupResults = [];
    
    for (const profile of profiles) {
      try {
        const { data: authUser, error } = await supabase.auth.admin.getUserById(profile.id);
        
        // Si no existe en Auth, es un perfil huérfano
        if (error || !authUser.user) {
          // Eliminar perfil huérfano
          const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', profile.id);

          if (deleteError) {
            cleanupResults.push({ 
              id: profile.id, 
              name: `${profile.first_name} ${profile.last_name}`,
              status: 'error', 
              error: deleteError.message 
            });
          } else {
            cleanupResults.push({ 
              id: profile.id, 
              name: `${profile.first_name} ${profile.last_name}`,
              status: 'deleted' 
            });
            console.log(`Cleaned up orphaned profile: ${profile.first_name} ${profile.last_name} (${profile.id})`);
          }
        }
      } catch (error) {
        cleanupResults.push({ 
          id: profile.id, 
          name: `${profile.first_name} ${profile.last_name}`,
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const deletedCount = cleanupResults.filter(r => r.status === 'deleted').length;
    console.log(`Cleaned up ${deletedCount} orphaned profiles`);

    revalidatePath('/superadmin/users');
    return { success: true, cleanedUp: cleanupResults };
  } catch (error) {
    console.error('Error in cleanupOrphanedProfiles:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
