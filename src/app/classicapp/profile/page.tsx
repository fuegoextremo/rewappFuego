// src/app/classicapp/profile/page.tsx
import { createClientServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/client/ProfileForm";
import ChangePasswordForm from "@/components/client/ChangePasswordForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export const revalidate = 0;

export default async function ClassicProfilePage() {
  const supabase = createClientServer();

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // Obtener perfil del usuario actual
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de navegación */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link 
            href="/classicapp" 
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Volver
          </Link>
          <h1 className="font-semibold">Mi Perfil</h1>
          <div className="w-16"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm defaultValues={{
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              phone: profile.phone || '',
              birth_date: profile.birth_date || ''
            }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* Switch a SPA */}
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-700 mb-2">¿Prefieres la experiencia SPA?</p>
          <Link 
            href="/client" 
            className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            🚀 Ir a SPA App
          </Link>
        </div>
      </div>
    </div>
  );
}