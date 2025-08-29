import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
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
