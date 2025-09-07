import { createClientServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';
import { SuperAdminGuard } from '@/components/auth/RoleGuards';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClientServer();
  
  // Verificar autenticación
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  // Verificar rol de superadmin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    redirect('/client'); // Redirigir a su dashboard normal
  }

  return (
    <SuperAdminGuard>
      <div className="flex h-screen flex-col md:flex-row bg-gray-50">
        {/* Sidebar - Desktop: sidebar vertical a la izquierda, Mobile: navbar fijo en la parte inferior */}
        <div className="fixed bottom-0 left-0 right-0 md:static md:w-64 md:flex-none z-50 md:order-1">
          <SuperAdminSidebar userProfile={profile} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto md:order-2">
          {/* Content Container con bordes redondeados */}
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            <div className="mx-auto max-w-7xl bg-white rounded-lg shadow-sm min-h-full p-4 md:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
