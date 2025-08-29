import { getDashboardStats, getCustomPeriodStats } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Gift, Target } from 'lucide-react';
import DashboardCharts from '@/components/admin/DashboardCharts';
import PeriodSelector from '@/components/admin/PeriodSelector';
import TopClients from '@/components/admin/TopClients';

interface DashboardPageProps {
  searchParams: {
    period?: string;
    start?: string;
    end?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const period = searchParams.period || '7';
  const customStart = searchParams.start;
  const customEnd = searchParams.end;

  // Obtener datos según el período seleccionado
  let dashboardData;
  if (period === 'custom' && customStart && customEnd) {
    dashboardData = await getCustomPeriodStats(customStart, customEnd);
  } else {
    const days = parseInt(period) || 7;
    dashboardData = await getDashboardStats(days);
  }

  if (!dashboardData.success) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error al cargar los datos del dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = dashboardData.data!;

  // Obtener etiqueta del período
  const getPeriodLabel = () => {
    if (period === 'custom' && customStart && customEnd) {
      const start = new Date(customStart).toLocaleDateString('es-ES');
      const end = new Date(customEnd).toLocaleDateString('es-ES');
      return `${start} - ${end}`;
    }
    return period === '7' ? 'Últimos 7 días' : 'Últimos 30 días';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Actualizado: {new Date().toLocaleDateString('es-ES')}
        </Badge>
      </div>

      {/* Selector de Período */}
      <PeriodSelector selectedPeriod={period} />

      {/* Stats de Hoy/Último Día */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Check-ins {period === 'custom' ? 'Último Día' : 'Hoy'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.today.checkins}</div>
            <p className="text-xs text-muted-foreground">
              Total período: {data.period.checkins.reduce((a, b) => a + b, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nuevos Usuarios {period === 'custom' ? 'Último Día' : 'Hoy'}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.today.newUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total período: {data.period.newUsers.reduce((a, b) => a + b, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cupones Ganados {period === 'custom' ? 'Último Día' : 'Hoy'}
            </CardTitle>
            <Gift className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.today.couponsWon}</div>
            <p className="text-xs text-muted-foreground">
              Total período: {data.period.couponsWon.reduce((a, b) => a + b, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cupones Canjeados {period === 'custom' ? 'Último Día' : 'Hoy'}
            </CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.today.couponsRedeemed}</div>
            <p className="text-xs text-muted-foreground">
              Total período: {data.period.couponsRedeemed.reduce((a, b) => a + b, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <DashboardCharts 
        data={data.period} 
        period={getPeriodLabel()}
      />

      {/* Top Clientes */}
      <TopClients 
        periodClients={data.topClients.period}
        allTimeClients={data.topClients.allTime}
        periodLabel={getPeriodLabel()}
      />
    </div>
  );
}
