"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { ImageUploader } from "@/components/shared/ImageUploader";

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
}

export default function CheckinSettingsCard({ 
  settings, 
  onUpdate, 
  onReset,
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
    streak_break_days: getSettingValue('streak_break_days', '12'),
    streak_expiry_days: getSettingValue('streak_expiry_days', '90'),
    streak_initial_image: getSettingValue('streak_initial_image', '/images/badge-default.png'),
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
      const streakBreakDays = parseInt(formData.streak_break_days);
      const streakExpiryDays = parseInt(formData.streak_expiry_days);

      if (dailyPoints < 0 || dailyPoints > 1000) {
        throw new Error('Los puntos por check-in deben estar entre 0 y 1000');
      }

      if (maxCheckins < 1 || maxCheckins > 100) {
        throw new Error('El límite de check-ins debe estar entre 1 y 100 por día');
      }

      if (streakBreakDays < 1 || streakBreakDays > 365) {
        throw new Error('Los días para romper racha deben estar entre 1 y 365');
      }

      if (streakExpiryDays < streakBreakDays || streakExpiryDays > 365) {
        throw new Error('Los días de expiración deben ser mayores a los días de ruptura y no superar 365');
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
          streak_break_days: '12',
          streak_expiry_days: '90',
          streak_initial_image: '/images/badge-default.png',
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
    <div className="space-y-6">
      {/* Cabecera de sección */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Check-ins</p>
          <h2 className="text-base font-semibold text-gray-900">Configuración de Check-ins</h2>
          <p className="text-sm text-gray-500 mt-0.5">Controla los puntos y límites para check-ins diarios</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isResetting || isLoading}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
          {isResetting ? "Reseteando..." : "Resetear"}
        </Button>
      </div>

      {/* Grupo: puntos y límites */}
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {/* Puntos por check-in */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white">
          <div className="flex-1 min-w-0">
            <Label htmlFor="daily_points" className="text-sm font-medium text-gray-800 cursor-pointer">
              Giros de ruleta por check-in
            </Label>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">Giros que recibe el usuario por cada check-in (0–1000)</p>
          </div>
          <Input
            id="daily_points"
            type="number"
            min="0"
            max="1000"
            value={formData.checkin_points_daily}
            onChange={(e) => handleInputChange('checkin_points_daily', e.target.value)}
            disabled={isLoading}
            className="w-20 text-right text-sm"
          />
        </div>

        {/* Límite de check-ins */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white">
          <div className="flex-1 min-w-0">
            <Label htmlFor="max_checkins" className="text-sm font-medium text-gray-800 cursor-pointer">
              Límite de check-ins por día
            </Label>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">Máximo de check-ins que puede hacer un usuario al día (1–100)</p>
          </div>
          <Input
            id="max_checkins"
            type="number"
            min="1"
            max="100"
            value={formData.max_checkins_per_day}
            onChange={(e) => handleInputChange('max_checkins_per_day', e.target.value)}
            disabled={isLoading}
            className="w-20 text-right text-sm"
          />
        </div>
      </div>

      {/* Grupo: rachas */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Rachas</p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {/* Días para romper racha */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white">
            <div className="flex-1 min-w-0">
              <Label htmlFor="streak_break_days" className="text-sm font-medium text-gray-800 cursor-pointer">
                Días para romper racha
              </Label>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">Días consecutivos sin check-in antes de que la racha se rompa</p>
            </div>
            <Input
              id="streak_break_days"
              type="number"
              min="1"
              max="365"
              value={formData.streak_break_days}
              onChange={(e) => handleInputChange('streak_break_days', e.target.value)}
              disabled={isLoading}
              className="w-20 text-right text-sm"
            />
          </div>

          {/* Días para expirar racha */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white">
            <div className="flex-1 min-w-0">
              <Label htmlFor="streak_expiry_days" className="text-sm font-medium text-gray-800 cursor-pointer">
                Días para expirar racha
              </Label>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">Días totales para que la racha expire completamente (debe ser mayor a días de ruptura)</p>
            </div>
            <Input
              id="streak_expiry_days"
              type="number"
              min="1"
              max="365"
              value={formData.streak_expiry_days}
              onChange={(e) => handleInputChange('streak_expiry_days', e.target.value)}
              disabled={isLoading}
              className="w-20 text-right text-sm"
            />
          </div>

          {/* Imagen por defecto (racha en cero) */}
          <div className="px-4 py-3 bg-white space-y-1.5">
            <ImageUploader
              label="Imagen por defecto (racha en cero)"
              description="Se muestra como punto de inicio en el medidor de racha cuando el usuario no ha alcanzado ningún premio"
              fieldName="streak_initial"
              bucket="branding"
              value={formData.streak_initial_image}
              onChange={(url) => handleInputChange('streak_initial_image', url)}
              disabled={isLoading}
              previewWidth={60}
              previewHeight={60}
              recommendedSize="60x60"
            />
          </div>
        </div>
      </div>

      {/* Vista previa compacta */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Resumen</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Giros/día máx.</span>
            <span className="font-medium text-gray-800">
              {parseInt(formData.checkin_points_daily) * parseInt(formData.max_checkins_per_day)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ruptura</span>
            <span className="font-medium text-gray-800">{formData.streak_break_days}d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Check-ins/día</span>
            <span className="font-medium text-gray-800">{formData.max_checkins_per_day}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expiración</span>
            <span className="font-medium text-gray-800">{formData.streak_expiry_days}d</span>
          </div>
        </div>
      </div>

      {/* Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading || isResetting}
          size="sm"
        >
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
