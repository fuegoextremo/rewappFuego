"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateSystemSettings, resetSettingsToDefault, type SystemSetting } from "../../../app/admin/settings/actions";
import { BellIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface NotificacionesSectionProps {
  settings: SystemSetting[];
}

export default function NotificacionesSection({ settings }: NotificacionesSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  // Extraer valores actuales
  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const [formData, setFormData] = useState({
    checkin_points_daily: getSettingValue('checkin_points_daily', '10'),
    max_checkins_per_day: getSettingValue('max_checkins_per_day', '1'),
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validaciones
      const dailyPoints = parseInt(formData.checkin_points_daily);
      const maxCheckins = parseInt(formData.max_checkins_per_day);

      if (dailyPoints < 0 || dailyPoints > 1000) {
        throw new Error('Los puntos por check-in deben estar entre 0 y 1000');
      }

      if (maxCheckins < 1 || maxCheckins > 10) {
        throw new Error('El límite de check-ins debe estar entre 1 y 10 por día');
      }

      const result = await updateSystemSettings({
        checkin_points_daily: dailyPoints,
        max_checkins_per_day: maxCheckins,
      });

      if (result.success) {
        toast({
          title: "¡Configuración guardada!",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar configuración",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const result = await resetSettingsToDefault('notifications');
      
      if (result.success) {
        toast({
          title: "¡Configuración reseteada!",
          description: result.message,
        });
        
        // Resetear valores del formulario
        setFormData({
          checkin_points_daily: '10',
          max_checkins_per_day: '1',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al resetear configuración",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BellIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900">Configuración de Check-ins y Notificaciones</CardTitle>
              <CardDescription className="text-blue-700">
                Ajusta los parámetros de visitas diarias y sistema de puntos
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isLoading}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {isResetting ? "Reseteando..." : "Resetear"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="checkin_points_daily" className="text-sm font-medium">
              Puntos por Check-in Diario
            </Label>
            <Input
              id="checkin_points_daily"
              type="number"
              min="0"
              max="1000"
              value={formData.checkin_points_daily}
              onChange={(e) => handleInputChange('checkin_points_daily', e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Cantidad de puntos que gana un usuario por cada check-in diario
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_checkins_per_day" className="text-sm font-medium">
              Máximo Check-ins por Día
            </Label>
            <Input
              id="max_checkins_per_day"
              type="number"
              min="1"
              max="10"
              value={formData.max_checkins_per_day}
              onChange={(e) => handleInputChange('max_checkins_per_day', e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Límite de check-ins que puede hacer un usuario por día
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={isLoading || isResetting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">📋 Información importante</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Los cambios se aplican inmediatamente en todo el sistema</li>
            <li>• Los puntos por check-in afectan la progresión de usuarios</li>
            <li>• El límite diario previene abuso del sistema de recompensas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
