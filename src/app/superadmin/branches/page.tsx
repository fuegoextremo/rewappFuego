import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPinIcon } from "@heroicons/react/24/outline";
import BranchesTable from "@/components/superadmin/BranchesTable";
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateBranchButton } from "@/components/superadmin/CreateBranchButton";

type BranchWithStats = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  user_profiles: { count: number }[];
  check_ins: { count: number }[];
};

export const revalidate = 0; // Asegurar que siempre se recarguen los datos

export default async function BranchesPage() {
  const supabase = createAdminClient();

  const { data: branches, error } = await supabase
    .from('branches')
    .select(`
      *,
      user_profiles:user_profiles!user_profiles_branch_id_fkey(count),
      check_ins:check_ins!check_ins_branch_id_fkey(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading branches:', error);
    return <div>Error al cargar las sucursales</div>;
  }

  const branchesData = (branches || []) as BranchWithStats[];

  const breadcrumbItems = [
    { label: "SuperAdmin", href: "/superadmin/dashboard" },
    { label: "Sucursales", href: "/superadmin/branches", current: true }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Sucursales</h1>
          <p className="text-gray-600 mt-1">
            Administra todas las sucursales del sistema
          </p>
        </div>
        <CreateBranchButton />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sucursales</CardTitle>
            <MapPinIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchesData.length}</div>
            <p className="text-xs text-muted-foreground">
              {branchesData.filter(b => b.is_active).length} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <div className="h-4 w-4 bg-blue-100 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branchesData.reduce((acc, branch) => acc + (branch.user_profiles?.[0]?.count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              En todas las sucursales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Totales</CardTitle>
            <div className="h-4 w-4 bg-green-100 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branchesData.reduce((acc, branch) => acc + (branch.check_ins?.[0]?.count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Visitas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de sucursales */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sucursales</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchesTable branches={branchesData} />
        </CardContent>
      </Card>
    </div>
  );
}
