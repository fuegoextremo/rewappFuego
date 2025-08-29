"use client";

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface PeriodSelectorProps {
  selectedPeriod: string;
}

export default function PeriodSelector({ selectedPeriod }: PeriodSelectorProps) {
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const predefinedPeriods = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: 'custom', label: 'Período personalizado' },
  ];

  const handlePeriodClick = (value: string) => {
    if (value === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      startTransition(() => {
        router.push(`/admin/dashboard?period=${value}`);
      });
    }
  };

  const handleCustomSubmit = () => {
    if (customStartDate && customEndDate) {
      startTransition(() => {
        router.push(`/admin/dashboard?period=custom&start=${customStartDate}&end=${customEndDate}`);
      });
      setShowCustom(false);
    }
  };

  // Calcular fechas para mostrar en los botones
  const getDateRange = (days: string) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days));
    
    return `${format(start, 'dd MMM', { locale: es })} - ${format(end, 'dd MMM', { locale: es })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600" />
          Seleccionar Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {predefinedPeriods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "outline"}
              onClick={() => handlePeriodClick(period.value)}
              className="flex-1 min-w-0"
            >
              <div className="text-center">
                <div className="font-medium">{period.label}</div>
                {period.value !== 'custom' && (
                  <div className="text-xs opacity-70">
                    {getDateRange(period.value)}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>

        {showCustom && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Período Personalizado</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCustomSubmit}
                disabled={!customStartDate || !customEndDate || isPending}
                className="flex-1"
              >
                {isPending ? 'Aplicando...' : 'Aplicar Período'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCustom(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
