"use client";

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';
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

  // Función para obtener el label del botón según el período seleccionado
  const getButtonLabel = (period: string) => {
    if (period === '7') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      return `${format(start, 'dd MMM', { locale: es })} - ${format(end, 'dd MMM', { locale: es })}`;
    }
    if (period === '30') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      return `${format(start, 'dd MMM', { locale: es })} - ${format(end, 'dd MMM', { locale: es })}`;
    }
    if (period === 'custom' && customStartDate && customEndDate) {
      const start = format(new Date(customStartDate), 'dd MMM', { locale: es });
      const end = format(new Date(customEndDate), 'dd MMM', { locale: es });
      return `${start} - ${end}`;
    }
    return 'Personalizado';
  };

  return (
    <Card className="p-1 bg-gray-50/80 border-0 shadow-none">
      <div className="flex items-center gap-1">
        {/* Botón 7 días */}
        <Button
          variant={selectedPeriod === '7' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handlePeriodClick('7')}
          disabled={isPending}
          className={`
            h-8 px-4 text-xs font-medium rounded-lg transition-all
            ${selectedPeriod === '7' 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          {selectedPeriod === '7' ? getButtonLabel('7') : 'Últimos 7 días'}
        </Button>

        {/* Botón 30 días */}
        <Button
          variant={selectedPeriod === '30' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handlePeriodClick('30')}
          disabled={isPending}
          className={`
            h-8 px-4 text-xs font-medium rounded-lg transition-all
            ${selectedPeriod === '30' 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          {selectedPeriod === '30' ? getButtonLabel('30') : 'Últimos 30 días'}
        </Button>

        {/* Botón personalizado */}
        <Button
          variant={selectedPeriod === 'custom' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handlePeriodClick('custom')}
          disabled={isPending}
          className={`
            h-8 px-4 text-xs font-medium rounded-lg transition-all
            ${selectedPeriod === 'custom' 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          <CalendarIcon className="w-3 h-3 mr-1.5" />
          {selectedPeriod === 'custom' ? getButtonLabel('custom') : 'Personalizado'}
        </Button>
      </div>

      {/* Modal de selección de fechas personalizada */}
      {showCustom && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium text-gray-900">Seleccionar rango personalizado</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha inicial</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || format(new Date(), 'yyyy-MM-dd')}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha final</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleCustomSubmit}
                disabled={!customStartDate || !customEndDate || isPending}
                className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
              >
                {isPending ? 'Aplicando...' : 'Aplicar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCustom(false)}
                disabled={isPending}
                className="h-7 px-3 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
