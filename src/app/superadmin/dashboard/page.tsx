import { createAdminClient } from '@/lib/supabase/admin';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  TrophyIcon 
} from '@heroicons/react/24/outline';

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const supabase = createAdminClient();

  // Obtener métricas globales
  const [
    { count: totalUsers },
    { count: totalBranches },
    { count: totalCheckins },
    { count: totalCoupons },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('branches').select('id', { count: 'exact', head: true }),
    supabase.from('check_ins').select('id', { count: 'exact', head: true }),
    supabase.from('coupons').select('id', { count: 'exact', head: true }),
    supabase
      .from('check_ins')
      .select(`
        id,
        created_at,
        user_profiles!check_ins_user_id_fkey (first_name, last_name),
        branches!check_ins_branch_id_fkey (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const breadcrumbItems = [
    { label: "SuperAdmin", href: "/superadmin/dashboard", current: true }
  ];

  const stats = [
    {
      name: 'Total Usuarios',
      value: totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Sucursales Activas',
      value: totalBranches || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Check-ins Totales',
      value: totalCheckins || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Cupones Generados',
      value: totalCoupons || 0,
      icon: TrophyIcon,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard SuperAdmin</h1>
        <p className="text-gray-600">
          Vista general del sistema completo de REWAPP
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
        </div>
        <div className="p-6">
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">
                      <strong>
                        {activity.user_profiles?.first_name} {activity.user_profiles?.last_name}
                      </strong>
                      {' '}realizó check-in en{' '}
                      <strong>{activity.branches?.name}</strong>
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.created_at!).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <a 
              href="/superadmin/branches" 
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
            >
              Gestionar Sucursales
            </a>
            <a 
              href="/superadmin/users" 
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
            >
              Gestionar Usuarios
            </a>
            <a 
              href="/admin/dashboard" 
              className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              🏢 Entrar a Administración
            </a>
            <a 
              href="/superadmin/system" 
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
            >
              Configuraciones
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistema</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Estado:</span>
              <span className="text-sm font-medium text-green-600">Operativo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Versión:</span>
              <span className="text-sm font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Base de Datos:</span>
              <span className="text-sm font-medium text-green-600">Conectada</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Soporte</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              ¿Necesitas ayuda? Contacta al equipo de desarrollo.
            </p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
              Contactar Soporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
