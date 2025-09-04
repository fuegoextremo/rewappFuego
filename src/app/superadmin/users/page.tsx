import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, UserPlusIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { getAllUsers } from './actions';
import { createAdminClient } from "@/lib/supabase/admin";
import UsersTable from '@/components/superadmin/UsersTable';
import CreateUserButton from '@/components/superadmin/CreateUserButton';
import CleanupOrphanedUsersButton from '@/components/superadmin/CleanupOrphanedUsersButton';
import CleanupOrphanedProfilesButton from '@/components/superadmin/CleanupOrphanedProfilesButton';

export const revalidate = 0; // Asegurar que siempre se recarguen los datos

export default async function UsersPage() {
  const result = await getAllUsers();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error al cargar usuarios</div>
          <p className="text-gray-600">{result.error}</p>
        </div>
      </div>
    );
  }

  // Obtener las sucursales disponibles
  const supabase = createAdminClient();
  const { data: branches, error: branchesError } = await supabase
    .from('branches')
    .select('id, name, is_active')
    .eq('is_active', true)
    .order('name');

  if (branchesError) {
    console.error('Error loading branches:', branchesError);
  }

  const users = result.data || [];
  const branchesData = branches || [];
  
  // Estadísticas
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => ['admin', 'superadmin'].includes(u.role || '')).length;
  const totalCheckins = users.reduce((sum, u) => sum + (u.total_checkins || 0), 0);

  const breadcrumbItems = [
    { label: "SuperAdmin", href: "/superadmin/dashboard" },
    { label: "Gestión de Usuarios", href: "/superadmin/users", current: true }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión Avanzada de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra todos los usuarios del sistema con control total sobre roles y permisos
          </p>
        </div>
        <div className="flex gap-3">
          <CreateUserButton branches={branchesData} />
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Gestión Avanzada de Usuarios del Sistema
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Aquí puedes gestionar TODOS los usuarios del sistema REWAPP: SuperAdmins, Admins, Verificadores y Usuarios regulares. 
                Las sucursales son solo datos de referencia para el registro y escaneo, todo está centralizado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <UsersIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <UserPlusIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((activeUsers / totalUsers) * 100 || 0).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <ShieldCheckIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Admins y SuperAdmins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Totales</CardTitle>
            <div className="h-4 w-4 bg-orange-100 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheckins}</div>
            <p className="text-xs text-muted-foreground">
              Todas las visitas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <p className="text-sm text-gray-600">
            Gestiona usuarios, roles, permisos y acciones administrativas
          </p>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} branches={branchesData} />
        </CardContent>
      </Card>

      {/* Herramientas de Administración Avanzada */}
      <Card className="border-orange-200">
        <CardHeader className="bg-orange-50">
          <CardTitle className="text-orange-800 text-sm">🔧 Herramientas de Administración Avanzada</CardTitle>
          <p className="text-xs text-orange-600">
            Utilizar solo para limpieza de datos inconsistentes o debugging
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <CleanupOrphanedUsersButton />
            <CleanupOrphanedProfilesButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
