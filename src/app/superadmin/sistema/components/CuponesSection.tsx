"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateSystemSettings, resetSettingsToDefault, type SystemSetting } from "../actions";
import { TicketIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface CuponesSectionProps {
  settings: SystemSetting[];
}

export default function CuponesSection({ settings }: CuponesSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  // Extraer valores actuales
  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const [formData, setFormData] = useState({
    default_coupon_expiry_days: getSettingValue('default_coupon_expiry_days', '30'),
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validaciones
      const expiryDays = parseInt(formData.default_coupon_expiry_days);

      if (expiryDays < 1 || expiryDays > 365) {
        throw new Error('Los días de expiración deben estar entre 1 y 365 días');
      }

      const result = await updateSystemSettings(formData);

      if (result.success) {
        toast({
          title: "¡Configuración actualizada!",
          description: result.message,
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
    setIsResetting(true);
    try {
      const result = await resetSettingsToDefault('coupons');

      if (result.success) {
        // Actualizar el formulario con valores por defecto
        setFormData({
          default_coupon_expiry_days: '30',
        });

        toast({
          title: "¡Configuración reseteada!",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error al resetear",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TicketIcon className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle className="text-green-800">Configuración de Cupones</CardTitle>
              <CardDescription className="text-green-600">
                Controla el comportamiento por defecto de los cupones
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isLoading}
            className="text-green-600 border-green-300 hover:bg-green-100"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {isResetting ? "Reseteando..." : "Resetear"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Días de expiración */}
          <div className="space-y-2">
            <Label htmlFor="expiry_days" className="text-sm font-medium text-gray-700">
              Días de expiración por defecto
            </Label>
            <Input
              id="expiry_days"
              type="number"
              min="1"
              max="365"
              value={formData.default_coupon_expiry_days}
              onChange={(e) => handleInputChange('default_coupon_expiry_days', e.target.value)}
              className="border-green-200 focus:border-green-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Tiempo de expiración cuando no se especifica en el premio (1-365 días)
            </p>
          </div>

          {/* Información adicional */}
          <div className="space-y-3">
            <div className="bg-green-100 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">📋 Información importante</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Esta configuración solo se aplica cuando el premio no especifica expiración</li>
                <li>• Los cupones individuales pueden tener su propia fecha de expiración</li>
                <li>• No hay límite en la cantidad de cupones por usuario</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="bg-white/50 p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">Vista previa de configuración:</h4>
          <div className="text-sm">
            <span className="text-gray-600">Expiración por defecto:</span>
            <span className="ml-2 font-semibold text-green-700">
              {formData.default_coupon_expiry_days} días desde la creación
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Los cupones generados sin fecha específica expirarán en {formData.default_coupon_expiry_days} días
          </p>
        </div>

        {/* Botón de guardar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isLoading || isResetting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
