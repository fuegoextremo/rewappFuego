// src/app/admin/users/[id]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EditUserForm from "@/components/admin/EditUserForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type PageProps = {
  params: { id: string }
};

export const revalidate = 0;

export default async function AdminUserPage({ params }: PageProps) {
  const { id } = params;
  const supabase = createAdminClient();

  // Perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (profileError || !profile) {
    return notFound();
  }

  // Check-ins del usuario (histórico)
  const { data: checkins, error: checkinsError } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false }); // sin coma extra

  if (checkinsError) {
    // No es crítico para render; podrías loguearlo
    // console.error(checkinsError)
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUserForm defaultValues={profile} checkins={checkins ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}