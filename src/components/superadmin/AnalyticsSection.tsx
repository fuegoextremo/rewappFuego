"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateSystemSettings } from "@/app/superadmin/sistema/actions";
import { ArrowPathIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { SystemSetting } from "@/app/superadmin/sistema/actions";
import { DEFAULT_SETTINGS } from "@/constants/default-settings";

interface AnalyticsSectionProps {
  settings: SystemSetting[];
}

export default function AnalyticsSection({ settings }: AnalyticsSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const [formData, setFormData] = useState({
    analytics_checkin_value: getSettingValue('analytics_checkin_value', DEFAULT_SETTINGS.analytics_checkin_value || '50'),
    analytics_coupon_avg_value: getSettingValue('analytics_coupon_avg_value', DEFAULT_SETTINGS.analytics_coupon_avg_value || '150'),
    analytics_user_acquisition_cost: getSettingValue('analytics_user_acquisition_cost', DEFAULT_SETTINGS.analytics_user_acquisition_cost || '200'),
    analytics_spin_cost: getSettingValue('analytics_spin_cost', DEFAULT_SETTINGS.analytics_spin_cost || '10'),
    analytics_retention_multiplier: getSettingValue('analytics_retention_multiplier', DEFAULT_SETTINGS.analytics_retention_multiplier || '1.5'),
    analytics_premium_branch_multiplier: getSettingValue('analytics_premium_branch_multiplier', DEFAULT_SETTINGS.analytics_premium_branch_multiplier || '1.2'),
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validaciones
      const checkinValue = parseFloat(formData.analytics_checkin_value);
      const couponValue = parseFloat(formData.analytics_coupon_avg_value);
      const acquisitionCost = parseFloat(formData.analytics_user_acquisition_cost);
      const spinCost = parseFloat(formData.analytics_spin_cost);
      const retentionMultiplier = parseFloat(formData.analytics_retention_multiplier);
      const premiumMultiplier = parseFloat(formData.analytics_premium_branch_multiplier);

      if (checkinValue <= 0) {
        throw new Error('El valor por check-in debe ser mayor a 0');
      }
      if (couponValue <= 0) {
        throw new Error('El valor promedio de cupón debe ser mayor a 0');
      }
      if (acquisitionCost <= 0) {
        throw new Error('El costo de adquisición debe ser mayor a 0');
      }
      if (spinCost < 0) {
        throw new Error('El costo por giro no puede ser negativo');
      }
      if (retentionMultiplier <= 0) {
        throw new Error('El multiplicador de retención debe ser mayor a 0');
      }
      if (premiumMultiplier <= 0) {
        throw new Error('El multiplicador premium debe ser mayor a 0');
      }

      const result = await updateSystemSettings(formData);

      if (result.success) {
        toast({
          title: "¡Configuración guardada!",
          description: "Los valores de analytics han sido actualizados correctamente.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setFormData({
      analytics_checkin_value: DEFAULT_SETTINGS.analytics_checkin_value || '50',
      analytics_coupon_avg_value: DEFAULT_SETTINGS.analytics_coupon_avg_value || '150',
      analytics_user_acquisition_cost: DEFAULT_SETTINGS.analytics_user_acquisition_cost || '200',
      analytics_spin_cost: DEFAULT_SETTINGS.analytics_spin_cost || '10',
      analytics_retention_multiplier: DEFAULT_SETTINGS.analytics_retention_multiplier || '1.5',
      analytics_premium_branch_multiplier: DEFAULT_SETTINGS.analytics_premium_branch_multiplier || '1.2',
    });

    toast({
      title: "Valores reseteados",
      description: "Se han restaurado los valores por defecto. Recuerda guardar los cambios.",
    });
  };

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle className="text-green-800">Configuración de Analytics y Métricas</CardTitle>
              <CardDescription className="text-green-600">
                Valores monetarios y multiplicadores para el cálculo de analytics
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
            className="text-green-600 border-green-300 hover:bg-green-100"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Resetear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Valores Monetarios */}
          <div className="space-y-4">
            <h4 className="font-medium text-green-800 text-sm uppercase tracking-wide">
              💰 Valores Monetarios
            </h4>
            
            <div>
              <Label htmlFor="analytics_checkin_value" className="text-green-700">
                Valor por Check-in (MXN)
              </Label>
              <Input
                id="analytics_checkin_value"
                type="number"
                min="1"
                step="1"
                value={formData.analytics_checkin_value}
                onChange={(e) => handleInputChange('analytics_checkin_value', e.target.value)}
                disabled={isLoading}
                className="border-green-300 focus:border-green-500"
              />
              <p className="text-xs text-green-600 mt-1">
                Ingresos estimados por cada check-in
              </p>
            </div>

            <div>
              <Label htmlFor="analytics_coupon_avg_value" className="text-green-700">
                Valor Promedio de Cupón (MXN)
              </Label>
              <Input
                id="analytics_coupon_avg_value"
                type="number"
                min="1"
                step="1"
                value={formData.analytics_coupon_avg_value}
                onChange={(e) => handleInputChange('analytics_coupon_avg_value', e.target.value)}
                disabled={isLoading}
                className="border-green-300 focus:border-green-500"
              />
              <p className="text-xs text-green-600 mt-1">
                Valor promedio de los cupones canjeados
              </p>
            </div>

            <div>
              <Label htmlFor="analytics_user_acquisition_cost" className="text-green-700">
                Costo de Adquisición de Usuario (MXN)
              </Label>
              <Input
                id="analytics_user_acquisition_cost"
                type="number"
                min="1"
                step="1"
                value={formData.analytics_user_acquisition_cost}
                onChange={(e) => handleInputChange('analytics_user_acquisition_cost', e.target.value)}
                disabled={isLoading}
                className="border-green-300 focus:border-green-500"
              />
              <p className="text-xs text-green-600 mt-1">
                Costo promedio para adquirir un nuevo usuario
              </p>
            </div>
          </div>

          {/* Factores y Multiplicadores */}
          <div className="space-y-4">
            <h4 className="font-medium text-green-800 text-sm uppercase tracking-wide">
              📊 Factores y Multiplicadores
            </h4>

            <div>
              <Label htmlFor="analytics_spin_cost" className="text-green-700">
                Costo por Giro (MXN)
              </Label>
              <Input
                id="analytics_spin_cost"
                type="number"
                min="0"
                step="1"
                value={formData.analytics_spin_cost}
                onChange={(e) => handleInputChange('analytics_spin_cost', e.target.value)}
                disabled={isLoading}
                className="border-green-300 focus:border-green-500"
              />
              <p className="text-xs text-green-600 mt-1">
                Costo operativo por giro de ruleta
              </p>
            </div>

            <div>
              <Label htmlFor="analytics_retention_multiplier" className="text-green-700">
                Multiplicador de Retención
              </Label>
              <Input
                id="analytics_retention_multiplier"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.analytics_retention_multiplier}
                onChange={(e) => handleInputChange('analytics_retention_multiplier', e.target.value)}
                disabled={isLoading}
                className="border-green-300 focus:border-green-500"
              />
              <p className="text-xs text-green-600 mt-1">
                Usuarios retenidos valen X veces más (ej: 1.5 = 50% más)
              </p>
            </div>

            {/* 
            <div>
              <Label htmlFor="analytics_premium_branch_multiplier" className="text-green-700">
                Multiplicador Sucursal Premium
              </Label>
              <Input
                id="analytics_premium_branch_multiplier"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.analytics_premium_branch_multiplier}
                onChange={(e) => handleInputChange('analytics_premium_branch_multiplier', e.target.value)}
                disabled={isLoading}
                className="border-green-300 focus:border-green-500"
              />
              <p className="text-xs text-green-600 mt-1">
                Sucursales premium generan X veces más valor (ej: 1.2 = 20% más)
              </p>
            </div>
            */}
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end pt-4 border-t border-green-200">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>

        {/* Nota informativa */}
        <div className="bg-green-100 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            💡 <strong>Nota:</strong> Estos valores se usan para calcular los ingresos estimados y KPIs 
            en la página de Analytics. Los cambios se reflejan inmediatamente en los reportes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}