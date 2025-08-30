'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

type StreakSettings = {
  streak_break_days: string
  streak_expiry_days: string
}

type StreakSettingsCardProps = {
  settings: StreakSettings
  onUpdate: (settings: StreakSettings) => Promise<{ success: boolean; message?: string; error?: string }>
  onReset: () => Promise<{ success: boolean; message?: string; error?: string }>
  isAdminView?: boolean
}

export default function StreakSettingsCard({ 
  settings, 
  onUpdate, 
  onReset,
  isAdminView = false 
}: StreakSettingsCardProps) {
  const [formData, setFormData] = useState<StreakSettings>(settings)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()

  function handleInputChange(field: keyof StreakSettings, value: string) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleSave() {
    try {
      setIsLoading(true)

      // Validaciones
      const breakDays = parseInt(formData.streak_break_days);
      const expiryDays = parseInt(formData.streak_expiry_days);

      if (breakDays < 1 || breakDays > 30) {
        throw new Error('Los días para romper racha deben estar entre 1 y 30');
      }

      if (expiryDays < 7 || expiryDays > 365) {
        throw new Error('Los días de expiración deben estar entre 7 y 365');
      }

      if (expiryDays <= breakDays) {
        throw new Error('Los días de expiración deben ser mayores a los días para romper racha');
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
  }

  async function handleReset() {
    try {
      setIsResetting(true);
      const result = await onReset();
      
      if (result.success) {
        setFormData({
          streak_break_days: '12',
          streak_expiry_days: '90'
        });
        toast({
          title: "¡Configuración restablecida!",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error al restablecer",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            ⚡ Configuración de Rachas
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configura cuándo se rompen o expiran las rachas de los usuarios
          </p>
        </div>

        {/* Campos de configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Días para romper racha */}
          <div className="space-y-2">
            <Label htmlFor="break_days" className="text-sm font-medium text-gray-700">
              Días para romper racha
            </Label>
            <Input
              id="break_days"
              type="number"
              min="1"
              max="30"
              value={formData.streak_break_days}
              onChange={(e) => handleInputChange('streak_break_days', e.target.value)}
              className="border-orange-200 focus:border-orange-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Días sin check-in después de los cuales la racha se reinicia (1-30)
            </p>
          </div>

          {/* Días de expiración total */}
          <div className="space-y-2">
            <Label htmlFor="expiry_days" className="text-sm font-medium text-gray-700">
              Días de expiración total
            </Label>
            <Input
              id="expiry_days"
              type="number"
              min="7"
              max="365"
              value={formData.streak_expiry_days}
              onChange={(e) => handleInputChange('streak_expiry_days', e.target.value)}
              className="border-orange-200 focus:border-orange-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Días totales después de los cuales la racha expira completamente (7-365)
            </p>
          </div>
        </div>

        {/* Información sobre funcionalidad */}
        <div className="bg-orange-100 p-4 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">🔥 Cómo funcionan las rachas</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Si el usuario no hace check-in en los días configurados, la racha se reinicia</li>
            <li>• Si la racha total supera los días de expiración, se elimina completamente</li>
            <li>• Las rachas rotas se pueden reiniciar, las expiradas requieren empezar desde cero</li>
            <li>• Los premios de racha se otorgan cuando se alcanzan los umbrales configurados</li>
          </ul>
        </div>

        {/* Vista previa */}
        <div className="bg-white/50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">Vista previa de configuración:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Romper racha después de:</span>
              <span className="ml-2 font-semibold text-orange-700">
                {formData.streak_break_days} día{parseInt(formData.streak_break_days) > 1 ? 's' : ''} sin check-in
              </span>
            </div>
            <div>
              <span className="text-gray-600">Expiración total:</span>
              <span className="ml-2 font-semibold text-orange-700">
                {formData.streak_expiry_days} días totales
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ejemplo: Con la configuración actual, si un usuario no hace check-in por {formData.streak_break_days} día{parseInt(formData.streak_break_days) > 1 ? 's' : ''}, 
            su racha se reinicia. Si han pasado {formData.streak_expiry_days} días desde que empezó la racha, esta expira completamente.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between">
          {isAdminView && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading || isResetting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {isResetting ? 'Restableciendo...' : 'Restablecer valores por defecto'}
            </Button>
          )}
          <div className={!isAdminView ? 'ml-auto' : ''}>
            <Button
              onClick={handleSave}
              disabled={isLoading || isResetting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
