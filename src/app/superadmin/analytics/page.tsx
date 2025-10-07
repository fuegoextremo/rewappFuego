import { getAnalyticsData, refreshAnalytics } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Users, Activity, Target } from 'lucide-react';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import AnalyticsCharts from '@/components/superadmin/AnalyticsCharts';
import { redirect } from 'next/navigation';

// Revalidar cada 5 minutos para datos frescos pero no sobrecarga
export const revalidate = 300;

interface AnalyticsPageProps {
  searchParams: {
    period?: string;
  };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const period = searchParams.period || '30';
  const days = parseInt(period) || 30;

  // Obtener datos de analytics
  const analyticsResult = await getAnalyticsData(days);

  if (!analyticsResult.success) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics SuperAdmin</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error al cargar los datos de analytics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = analyticsResult.data!;

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Función para formatear porcentaje
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Acción del botón de actualizar
  async function handleRefresh() {
    'use server';
    await refreshAnalytics();
    redirect(`/superadmin/analytics?period=${period}&t=${Date.now()}`);
  }

  const breadcrumbItems = [
    { label: 'SuperAdmin', href: '/superadmin/dashboard' },
    { label: 'Analytics', current: true },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Analytics SuperAdmin</h1>
          <p className="text-gray-600">
            Análisis completo del rendimiento del negocio • Últimos {days} días
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            Actualizado: {new Date().toLocaleString('es-ES')}
          </Badge>
          <form action={handleRefresh}>
            <Button variant="outline" size="sm" type="submit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </form>
        </div>
      </div>

      {/* Selector de Período */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <a 
              href="/superadmin/analytics?period=7"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === '7' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 días
            </a>
            <a 
              href="/superadmin/analytics?period=30"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === '30' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 días
            </a>
            <a 
              href="/superadmin/analytics?period=90"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === '90' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              90 días
            </a>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Ejecutivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Estimados</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.kpis.estimatedRevenue)}
            </div>
            <div className="flex items-center mt-1">
              {data.kpis.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={`text-xs ${data.kpis.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.kpis.revenueGrowth)} vs período anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.kpis.activeUsers.toLocaleString()}</div>
            <div className="flex items-center mt-1">
              {data.kpis.userGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={`text-xs ${data.kpis.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.kpis.userGrowth)} vs período anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.kpis.engagementRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios con múltiples visitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.kpis.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cupones canjeados vs generados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Destacadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">🏆 Top Sucursal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data.topMetrics.topBranch.name}</div>
            <p className="text-sm text-muted-foreground">
              {data.topMetrics.topBranch.checkins} check-ins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">🎁 Premio Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data.topMetrics.topPrize.name}</div>
            <p className="text-sm text-muted-foreground">
              {data.topMetrics.topPrize.redeemed} canjes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">⏰ Hora Pico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data.topMetrics.peakHour.hour}:00</div>
            <p className="text-sm text-muted-foreground">
              {data.topMetrics.peakHour.checkins} check-ins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">📅 Mejor Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date(data.topMetrics.bestDay.date).toLocaleDateString('es-ES')}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.topMetrics.bestDay.checkins} check-ins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas de Analytics */}
      <AnalyticsCharts 
        data={data.period}
        kpis={data.kpis}
        hourlyActivity={data.hourlyActivity}
        totals={data.totals}
        period={`Últimos ${days} días`}
      />

      {/* Performance por Sucursal */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Sucursal</th>
                  <th className="text-right p-2">Check-ins</th>
                  <th className="text-right p-2">Ingresos</th>
                  <th className="text-right p-2">Usuarios</th>
                  <th className="text-right p-2">Conversión</th>
                </tr>
              </thead>
              <tbody>
                {data.branches.slice(0, 10).map((branch, index) => (
                  <tr key={branch.id} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index < 3 ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          #{index + 1}
                        </span>
                        {branch.name}
                      </div>
                    </td>
                    <td className="text-right p-2 font-medium">{branch.checkins}</td>
                    <td className="text-right p-2 font-medium text-green-600">
                      {formatCurrency(branch.revenue)}
                    </td>
                    <td className="text-right p-2">{branch.users}</td>
                    <td className="text-right p-2">{branch.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Nota de actualización */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Datos en tiempo real:</strong> Los analytics se actualizan automáticamente cada 5 minutos. 
            Usa el botón &quot;Actualizar&quot; para forzar una recarga inmediata.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}