// src/app/client/profile/page.tsx
import { createClientServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/client/ProfileForm";
import ChangePasswordForm from "@/components/client/ChangePasswordForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const revalidate = 0;

export default async function ClientProfilePage() {
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
    <div className="p-4 space-y-6">
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
    </div>
  );
}