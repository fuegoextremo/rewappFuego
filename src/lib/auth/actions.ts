"use server";

import { createClientServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function signOut() {
  const supabase = createClientServer();
  
  try {
    // Limpiar sesión del servidor
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
    }
  } catch (error) {
    console.error('Error during sign out:', error);
  }
  
  // Limpiar cookies manualmente para asegurar logout completo
  const cookieStore = cookies();
  cookieStore.getAll().forEach(cookie => {
    if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
      cookieStore.delete(cookie.name);
    }
  });
  
  // Redirigir con parámetro para bypass del middleware
  redirect('/login?logout=true');
}
