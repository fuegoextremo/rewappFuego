import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { UsersListClient } from '@/components/admin/UsersListClient';
import { getUsersPaginated } from './queries';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function Page() {
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin/dashboard' },
    { label: 'Usuarios', current: true }
  ];

  // Fetch inicial en paralelo: usuarios página 1 + sucursales para filtros
  const supabase = createAdminClient();
  const [initialData, { data: branches }] = await Promise.all([
    getUsersPaginated({ page: 1, pageSize: 20 }),
    supabase.from('branches').select('id, name').order('name'),
  ]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios del sistema (clientes, verificadores y admins)</p>
        </div>
      </div>

      {/* Paginated Users List */}
      <UsersListClient 
        initialUsers={initialData.users}
        initialTotal={initialData.total}
        initialPage={initialData.page}
        initialPageSize={initialData.pageSize}
        branches={branches || []}
      />
    </div>
  );
}
