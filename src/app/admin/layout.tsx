
import Sidebar from "@/components/admin/Sidebar";
import SuperAdminBanner from "@/components/admin/SuperAdminBanner";
import { UnauthorizedBanner } from "@/components/shared/UnauthorizedBanner";
import { AdminGuard } from "@/components/auth/RoleGuards";
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
    <AdminGuard>
      <div className="flex h-screen flex-col md:flex-row bg-gray-50">
        {/* Sidebar - Desktop: sidebar vertical a la izquierda, Mobile: navbar fijo en la parte inferior */}
        <div className="fixed bottom-0 left-0 right-0 md:static md:w-64 md:flex-none z-50 md:order-1">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto md:order-2">
        {/* SuperAdmin Banner - Solo móvil */}
        <div className="md:hidden pt-2">
          <SuperAdminBanner userProfile={userProfile} />
        </div>
        
        {/* Content Container con bordes redondeados */}
        <div className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="mx-auto max-w-7xl bg-white rounded-lg shadow-sm min-h-full p-4 md:p-6">
            {/* Banner de error */}
            <UnauthorizedBanner />
            {children}
          </div>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}
