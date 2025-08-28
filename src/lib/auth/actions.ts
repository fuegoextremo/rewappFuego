"use server";

import { createClientServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = createClientServer();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error during sign out:', error);
    // Aún así redirigimos al login para asegurar que el usuario sea desconectado
  }
  
  redirect('/auth/login');
}
