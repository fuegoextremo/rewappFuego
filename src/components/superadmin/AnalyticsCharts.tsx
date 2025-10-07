"use client";

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Bar, BarChart, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsChartsProps {
  data: {
    dates: string[];
    checkins: number[];
    newUsers: number[];
    couponsGenerated: number[];
    couponsRedeemed: number[];
    revenue: number[];
  };
  kpis: {
    estimatedRevenue: number;
    activeUsers: number;
    engagementRate: number;
    conversionRate: number;
  };
  hourlyActivity: {
    hour: number;
    activity: number;
    label: string;
  }[];
  totals: {
    totalCheckins: number;
    totalCouponsGenerated: number;
    totalCouponsRedeemed: number;
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
            <span className="text-gray-600">
              {entry.name.includes('Ingresos') || entry.name.includes('Revenue') 
                ? `$${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()
              }
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts({ data, hourlyActivity, totals, period }: AnalyticsChartsProps) {
  // Preparar datos para Revenue & Activity Chart
  const revenueActivityData = data.dates.map((date, index) => ({
    date,
    ingresos: data.revenue[index] || 0,
    checkins: data.checkins[index] || 0,
  }));

  // Preparar datos para User Engagement Chart
  const userEngagementData = data.dates.map((date, index) => ({
    date,
    nuevosUsuarios: data.newUsers[index] || 0,
    cuponesGenerados: data.couponsGenerated[index] || 0,
    cuponesCanjeados: data.couponsRedeemed[index] || 0,
  }));

  // 🔥 USAR TOTALES REALES (no sumas de arrays por día)
  const conversionFunnelData = [
    { step: 'Check-ins', value: totals.totalCheckins, color: '#3B82F6' },
    { step: 'Cupones Generados', value: totals.totalCouponsGenerated, color: '#8B5CF6' },
    { step: 'Cupones Canjeados', value: totals.totalCouponsRedeemed, color: '#10B981' },
  ];

  // 🔥 USAR DATOS REALES DE ACTIVIDAD POR HORA
  const hourlyHeatmapData = hourlyActivity;

  return (
    <div className="space-y-6">
      {/* Revenue & Activity + User Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Activity Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Ingresos y Actividad
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm">
              {period} • Ingresos estimados y check-ins diarios
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  yAxisId="checkins"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos (MXN)"
                  stroke="#10B981"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="checkins"
                  type="monotone"
                  dataKey="checkins"
                  name="Check-ins"
                  stroke="#3B82F6"
                  fill="url(#colorCheckins)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Engagement Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Engagement de Usuarios
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm">
              {period} • Nuevos usuarios y actividad de cupones
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userEngagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="nuevosUsuarios"
                  name="Nuevos Usuarios"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="cuponesGenerados"
                  name="Cupones Generados"
                  stackId="2"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="cuponesCanjeados"
                  name="Cupones Canjeados"
                  stackId="3"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel + Hourly Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Embudo de Conversión
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm">
              {period} • Flujo de conversión del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="step" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  interval={0}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
                  {conversionFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              Actividad por Hora del Día
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm">
              {period} • Check-ins distribuidos por hora (00:00 - 23:00)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={hourlyHeatmapData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900">{label}</p>
                          <p className="text-sm text-indigo-600">
                            <span className="font-medium">{payload[0].value}</span> check-ins
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="activity" 
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Resumen estadístico */}
            <div className="mt-4 grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Hora Pico</div>
                <div className="text-lg font-bold text-indigo-600">
                  {hourlyHeatmapData.reduce((max, hour) => 
                    hour.activity > max.activity ? hour : max, hourlyHeatmapData[0] || { label: '--', activity: 0 }
                  ).label}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Total Check-ins</div>
                <div className="text-lg font-bold text-green-600">
                  {hourlyHeatmapData.reduce((sum, hour) => sum + hour.activity, 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500">Promedio/Hora</div>
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(hourlyHeatmapData.reduce((sum, hour) => sum + hour.activity, 0) / 24)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}