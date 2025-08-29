"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BellIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

// Tipos importados directamente
type SystemSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  setting_type: string;
  category: string;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

interface CheckinSettingsCardProps {
  settings: SystemSetting[];
  onUpdate: (updates: Record<string, string>) => Promise<{ success: boolean; message?: string; error?: string }>;
  onReset: () => Promise<{ success: boolean; message?: string; error?: string }>;
  isAdminView?: boolean;
}

export default function CheckinSettingsCard({ 
  settings, 
  onUpdate, 
  onReset,
  isAdminView = false 
}: CheckinSettingsCardProps) {
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

      const result = await onUpdate(formData);

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
      const result = await onReset();

      if (result.success) {
        // Actualizar el formulario con valores por defecto
        setFormData({
          checkin_points_daily: '10',
          max_checkins_per_day: '1',
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
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellIcon className="w-6 h-6 text-indigo-600" />
            <div>
              <CardTitle className="text-indigo-800">
                {isAdminView ? "Configuración de Check-ins" : "Configuración de Check-ins y Notificaciones"}
              </CardTitle>
              <CardDescription className="text-indigo-600">
                Controla los puntos y límites para check-ins diarios
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isLoading}
            className="text-indigo-600 border-indigo-300 hover:bg-indigo-100"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {isResetting ? "Reseteando..." : "Resetear"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Puntos por check-in */}
          <div className="space-y-2">
            <Label htmlFor="daily_points" className="text-sm font-medium text-gray-700">
              Puntos por check-in diario
            </Label>
            <Input
              id="daily_points"
              type="number"
              min="0"
              max="1000"
              value={formData.checkin_points_daily}
              onChange={(e) => handleInputChange('checkin_points_daily', e.target.value)}
              className="border-indigo-200 focus:border-indigo-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Puntos que recibe el usuario por cada check-in realizado (0-1000)
            </p>
          </div>

          {/* Límite de check-ins */}
          <div className="space-y-2">
            <Label htmlFor="max_checkins" className="text-sm font-medium text-gray-700">
              Límite de check-ins por día
            </Label>
            <Input
              id="max_checkins"
              type="number"
              min="1"
              max="10"
              value={formData.max_checkins_per_day}
              onChange={(e) => handleInputChange('max_checkins_per_day', e.target.value)}
              className="border-indigo-200 focus:border-indigo-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Máximo número de check-ins que puede hacer un usuario por día (1-10)
            </p>
          </div>
        </div>

        {/* Información sobre funcionalidad */}
        <div className="bg-indigo-100 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-medium text-indigo-800 mb-2">📋 Cómo funciona el sistema</h4>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• Los usuarios ganan puntos automáticamente al hacer check-in</li>
            <li>• Los puntos se pueden usar para obtener spins en la ruleta</li>
            <li>• El límite diario previene abuso del sistema</li>
            <li>• Los check-ins consecutivos pueden dar bonificaciones adicionales</li>
          </ul>
        </div>

        {/* Vista previa */}
        <div className="bg-white/50 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-medium text-indigo-800 mb-2">Vista previa de configuración:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Puntos por check-in:</span>
              <span className="ml-2 font-semibold text-indigo-700">
                {formData.checkin_points_daily} puntos
              </span>
            </div>
            <div>
              <span className="text-gray-600">Límite diario:</span>
              <span className="ml-2 font-semibold text-indigo-700">
                {formData.max_checkins_per_day} check-in{parseInt(formData.max_checkins_per_day) > 1 ? 's' : ''} máximo
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Un usuario puede ganar máximo {parseInt(formData.checkin_points_daily) * parseInt(formData.max_checkins_per_day)} puntos por día mediante check-ins
          </p>
        </div>

        {/* Botón de guardar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isLoading || isResetting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
