"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateSystemSettings, resetSettingsToDefault, type SystemSetting } from "../actions";
import { getPrizeLimits } from "@/app/admin/settings/actions";
import { TrophyIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import PrizeLimitsForm from "@/components/admin/PrizeLimitsForm";

interface PremiosSectionProps {
  settings: SystemSetting[];
}

export default function PremiosSection({ settings }: PremiosSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [prizeLimits, setPrizeLimits] = useState({
    max_roulette_prizes: 10,
    max_streak_prizes: 5
  });
  const { toast } = useToast();

  // Cargar límites de premios al montar el componente
  useEffect(() => {
    async function loadPrizeLimits() {
      try {
        const result = await getPrizeLimits();
        if (result.success) {
          setPrizeLimits(result.data);
        }
      } catch (error) {
        console.error('Error loading prize limits:', error);
      }
    }
    loadPrizeLimits();
  }, []);

  // Función para refrescar límites después de actualizaciones
  const refreshPrizeLimits = async () => {
    try {
      const result = await getPrizeLimits();
      if (result.success) {
        setPrizeLimits(result.data);
      }
    } catch (error) {
      console.error('Error refreshing prize limits:', error);
    }
  };

  // Extraer valores actuales
  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const [formData, setFormData] = useState({
    max_prizes_per_company: getSettingValue('max_prizes_per_company', '50'),
    roulette_win_percentage: getSettingValue('roulette_win_percentage', '15'),
    spin_cooldown_seconds: getSettingValue('spin_cooldown_seconds', '30'),
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validaciones
      const maxPrizes = parseInt(formData.max_prizes_per_company);
      const winPercentage = parseInt(formData.roulette_win_percentage);
      const cooldown = parseInt(formData.spin_cooldown_seconds);

      if (maxPrizes < 1 || maxPrizes > 1000) {
        throw new Error('El número máximo de premios debe estar entre 1 y 1000');
      }

      if (winPercentage < 1 || winPercentage > 100) {
        throw new Error('El porcentaje de ganancia debe estar entre 1% y 100%');
      }

      if (cooldown < 0 || cooldown > 300) {
        throw new Error('El cooldown debe estar entre 0 y 300 segundos');
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
      const result = await resetSettingsToDefault('prizes');

      if (result.success) {
        // Actualizar el formulario con valores por defecto
        setFormData({
          max_prizes_per_company: '50',
          roulette_win_percentage: '15',
          spin_cooldown_seconds: '30',
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
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyIcon className="w-6 h-6 text-orange-600" />
            <div>
              <CardTitle className="text-orange-800">Configuración de Premios y Ruleta</CardTitle>
              <CardDescription className="text-orange-600">
                Controla los límites y comportamiento de los premios y la ruleta
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isLoading}
            className="text-orange-600 border-orange-300 hover:bg-orange-100"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {isResetting ? "Reseteando..." : "Resetear"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Máximo de premios */}
          <div className="space-y-2">
            <Label htmlFor="max_prizes" className="text-sm font-medium text-gray-700">
              Máximo de premios por empresa
            </Label>
            <Input
              id="max_prizes"
              type="number"
              min="1"
              max="1000"
              value={formData.max_prizes_per_company}
              onChange={(e) => handleInputChange('max_prizes_per_company', e.target.value)}
              className="border-orange-200 focus:border-orange-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Límite máximo de premios que puede tener una empresa
            </p>
          </div>

          {/* Porcentaje de ganancia */}
          <div className="space-y-2">
            <Label htmlFor="win_percentage" className="text-sm font-medium text-gray-700">
              Porcentaje de ganancia (%)
            </Label>
            <Input
              id="win_percentage"
              type="number"
              min="1"
              max="100"
              value={formData.roulette_win_percentage}
              onChange={(e) => handleInputChange('roulette_win_percentage', e.target.value)}
              className="border-orange-200 focus:border-orange-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Probabilidad de ganar en la ruleta (1-100%)
            </p>
          </div>

          {/* Cooldown entre spins */}
          <div className="space-y-2">
            <Label htmlFor="cooldown" className="text-sm font-medium text-gray-700">
              Cooldown entre spins (segundos)
            </Label>
            <Input
              id="cooldown"
              type="number"
              min="0"
              max="300"
              value={formData.spin_cooldown_seconds}
              onChange={(e) => handleInputChange('spin_cooldown_seconds', e.target.value)}
              className="border-orange-200 focus:border-orange-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Tiempo mínimo entre spins (recomendado: 30-60s)
            </p>
          </div>
        </div>

        {/* Información visual */}
        <div className="bg-white/50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">Vista previa de configuración:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Máximo premios:</span>
              <span className="ml-2 font-semibold text-orange-700">
                {formData.max_prizes_per_company} premios
              </span>
            </div>
            <div>
              <span className="text-gray-600">Probabilidad:</span>
              <span className="ml-2 font-semibold text-orange-700">
                {formData.roulette_win_percentage}% de ganar
              </span>
            </div>
            <div>
              <span className="text-gray-600">Cooldown:</span>
              <span className="ml-2 font-semibold text-orange-700">
                {formData.spin_cooldown_seconds}s entre spins
              </span>
            </div>
          </div>
        </div>

        {/* Límites de Premios - Solo SuperAdmin */}
        <div className="mt-8">
          <PrizeLimitsForm 
            initialLimits={prizeLimits}
            userRole="superadmin"
            onSuccess={refreshPrizeLimits}
          />
        </div>

        {/* Botón de guardar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isLoading || isResetting}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
