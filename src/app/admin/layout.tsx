
import Sidebar from "@/components/admin/Sidebar";
import SuperAdminBanner from "@/components/admin/SuperAdminBanner";
import { UnauthorizedBanner } from "@/components/shared/UnauthorizedBanner";
import { createClientServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ADMIN_ROLES = ['admin', 'superadmin', 'manager', 'verifier'];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role || '')) {
    redirect("/client");
  }

  // Crear el perfil completo para pasar a los componentes
  const userProfile = {
    ...profile,
    email: user.email || '',
  };

  return (
      <div className="flex h-screen flex-col md:flex-row bg-white">
        {/* Sidebar - Desktop: sidebar vertical a la izquierda, Mobile: navbar fijo en la parte inferior */}
        <div className="fixed bottom-0 left-0 right-0 md:static md:w-64 md:flex-none z-50 md:order-1">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto md:order-2">
        {/* SuperAdmin Banner - Solo móvil */}
        <div className="md:hidden pt-2 px-3">
          <SuperAdminBanner userProfile={userProfile} />
        </div>
        
        {/* Content Container — sin card anidada, fondo unificado */}
        <div className="mx-auto max-w-7xl min-h-full px-3 py-4 md:px-6 md:py-6 pb-24 md:pb-6">
          {/* Banner de error */}
          <UnauthorizedBanner />
          {children}
        </div>
      </div>
    </div>
  );
}
