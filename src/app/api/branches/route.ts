import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from '@/types/database';

export async function GET() {
  try {
    // SEGURIDAD: Verificar que el usuario esté autenticado
    const supabaseAuth = createServerComponentClient<Database>({ cookies });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Usar admin client para obtener branches (datos públicos para usuarios auth)
    const supabase = createAdminClient();
    
    const { data: branches, error } = await supabase
      .from('branches')
      .select('id, name, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching branches:', error);
      return NextResponse.json(
        { error: 'Error al cargar las sucursales' },
        { status: 500 }
      );
    }

    return NextResponse.json({ branches: branches || [] });
  } catch (error) {
    console.error('Error in branches API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
