"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

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
      {/* Gráfica de Check-ins y Nuevos Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Actividad de Usuarios ({period})
          </CardTitle>
          <CardDescription>Check-ins y registro de nuevos usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickMargin={8}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                labelFormatter={(label) => `Fecha: ${label}`}
                formatter={(value, name) => [
                  value,
                  name === 'checkins' ? 'Check-ins' : 'Nuevos Usuarios'
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="checkins" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Check-ins"
                dot={{ fill: '#10b981' }}
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Nuevos Usuarios"
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica de Cupones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Actividad de Cupones ({period})
          </CardTitle>
          <CardDescription>Cupones ganados vs canjeados</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickMargin={8}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                labelFormatter={(label) => `Fecha: ${label}`}
                formatter={(value, name) => [
                  value,
                  name === 'couponsWon' ? 'Cupones Ganados' : 'Cupones Canjeados'
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="couponsWon" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Cupones Ganados"
                dot={{ fill: '#8b5cf6' }}
              />
              <Line 
                type="monotone" 
                dataKey="couponsRedeemed" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Cupones Canjeados"
                dot={{ fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
