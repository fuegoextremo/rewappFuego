"use client";

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartData {
  date: string;
  checkins: number;
  newUsers: number;
  couponsWon: number;
  couponsRedeemed: number;
}

interface DashboardChartsProps {
  data: {
    dates: string[];
    checkins: number[];
    newUsers: number[];
    couponsWon: number[];
    couponsRedeemed: number[];
  };
  period: string;
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: TooltipPayload, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span className="text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ data, period }: DashboardChartsProps) {
  // Transformar datos para recharts
  const chartData: ChartData[] = data.dates.map((date, index) => ({
    date,
    checkins: data.checkins[index] || 0,
    newUsers: data.newUsers[index] || 0,
    couponsWon: data.couponsWon[index] || 0,
    couponsRedeemed: data.couponsRedeemed[index] || 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfica de Check-ins y Nuevos Usuarios con Area Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Actividad de Usuarios
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            {period} • Check-ins y registro de nuevos usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="checkinsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={1} />
              <XAxis 
                dataKey="date" 
                fontSize={11}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                fontSize={11}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="checkins"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#checkinsGradient)"
                strokeWidth={2}
                name="Check-ins"
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                stackId="2"
                stroke="#8b5cf6"
                fill="url(#usersGradient)"
                strokeWidth={2}
                name="Nuevos Usuarios"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica de Cupones con Area Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            Actividad de Cupones
          </CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            {period} • Cupones ganados vs canjeados
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="couponsWonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="couponsRedeemedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={1} />
              <XAxis 
                dataKey="date" 
                fontSize={11}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                fontSize={11}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="couponsWon"
                stackId="1"
                stroke="#10b981"
                fill="url(#couponsWonGradient)"
                strokeWidth={2}
                name="Cupones Ganados"
              />
              <Area
                type="monotone"
                dataKey="couponsRedeemed"
                stackId="2"
                stroke="#f59e0b"
                fill="url(#couponsRedeemedGradient)"
                strokeWidth={2}
                name="Cupones Canjeados"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
