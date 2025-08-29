"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateSystemSettings, resetSettingsToDefault, type SystemSetting } from "../../../app/admin/settings/actions";
import { BuildingOfficeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface EmpresaSectionProps {
  settings: SystemSetting[];
}

export default function EmpresaSection({ settings }: EmpresaSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  // Extraer valores actuales
  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const [formData, setFormData] = useState({
    company_name: getSettingValue('company_name', 'Mi Empresa'),
    company_logo_url: getSettingValue('company_logo_url', ''),
    company_theme_primary: getSettingValue('company_theme_primary', '#8b5cf6'),
    company_theme_secondary: getSettingValue('company_theme_secondary', '#a855f7'),
    company_contact_email: getSettingValue('company_contact_email', ''),
    company_contact_phone: getSettingValue('company_contact_phone', ''),
    company_address: getSettingValue('company_address', ''),
    company_terms_conditions: getSettingValue('company_terms_conditions', 'Términos y condiciones por definir...'),
    company_privacy_policy: getSettingValue('company_privacy_policy', 'Política de privacidad por definir...'),
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validaciones básicas
      if (!formData.company_name.trim()) {
        throw new Error('El nombre de la empresa es obligatorio');
      }

      if (formData.company_contact_email && !formData.company_contact_email.includes('@')) {
        throw new Error('El email de contacto debe tener un formato válido');
      }

      const result = await updateSystemSettings({
        company_name: formData.company_name.trim(),
        company_logo_url: formData.company_logo_url.trim(),
        company_theme_primary: formData.company_theme_primary,
        company_theme_secondary: formData.company_theme_secondary,
        company_contact_email: formData.company_contact_email.trim(),
        company_contact_phone: formData.company_contact_phone.trim(),
        company_address: formData.company_address.trim(),
        company_terms_conditions: formData.company_terms_conditions.trim(),
        company_privacy_policy: formData.company_privacy_policy.trim(),
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
      const result = await resetSettingsToDefault('general');
      
      if (result.success) {
        toast({
          title: "¡Configuración reseteada!",
          description: result.message,
        });
        
        // Resetear valores del formulario
        setFormData({
          company_name: 'Mi Empresa',
          company_logo_url: '',
          company_theme_primary: '#8b5cf6',
          company_theme_secondary: '#a855f7',
          company_contact_email: '',
          company_contact_phone: '',
          company_address: '',
          company_terms_conditions: 'Términos y condiciones por definir...',
          company_privacy_policy: 'Política de privacidad por definir...',
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
    <Card className="border-green-200">
      <CardHeader className="bg-green-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-900">Configuración de la Empresa</CardTitle>
              <CardDescription className="text-green-700">
                Información corporativa, branding y documentos legales
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isLoading}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {isResetting ? "Reseteando..." : "Resetear"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-8">
          {/* Información básica */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-sm font-medium">
                  Nombre de la Empresa *
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  disabled={isLoading}
                  placeholder="Mi Empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_logo_url" className="text-sm font-medium">
                  URL del Logo
                </Label>
                <Input
                  id="company_logo_url"
                  value={formData.company_logo_url}
                  onChange={(e) => handleInputChange('company_logo_url', e.target.value)}
                  disabled={isLoading}
                  placeholder="https://ejemplo.com/logo.png"
                />
                {formData.company_logo_url && (
                  <div className="mt-2">
                    <Image
                      src={formData.company_logo_url}
                      alt="Preview del logo"
                      width={100}
                      height={50}
                      className="rounded border"
                      onError={() => toast({
                        title: "Error",
                        description: "No se pudo cargar la imagen del logo",
                        variant: "destructive"
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colores del tema */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Colores del Tema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company_theme_primary" className="text-sm font-medium">
                  Color Primario
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="company_theme_primary"
                    type="color"
                    value={formData.company_theme_primary}
                    onChange={(e) => handleInputChange('company_theme_primary', e.target.value)}
                    disabled={isLoading}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.company_theme_primary}
                    onChange={(e) => handleInputChange('company_theme_primary', e.target.value)}
                    disabled={isLoading}
                    placeholder="#8b5cf6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_theme_secondary" className="text-sm font-medium">
                  Color Secundario
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="company_theme_secondary"
                    type="color"
                    value={formData.company_theme_secondary}
                    onChange={(e) => handleInputChange('company_theme_secondary', e.target.value)}
                    disabled={isLoading}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.company_theme_secondary}
                    onChange={(e) => handleInputChange('company_theme_secondary', e.target.value)}
                    disabled={isLoading}
                    placeholder="#a855f7"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company_contact_email" className="text-sm font-medium">
                  Email de Contacto
                </Label>
                <Input
                  id="company_contact_email"
                  type="email"
                  value={formData.company_contact_email}
                  onChange={(e) => handleInputChange('company_contact_email', e.target.value)}
                  disabled={isLoading}
                  placeholder="contacto@miempresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_contact_phone" className="text-sm font-medium">
                  Teléfono de Contacto
                </Label>
                <Input
                  id="company_contact_phone"
                  value={formData.company_contact_phone}
                  onChange={(e) => handleInputChange('company_contact_phone', e.target.value)}
                  disabled={isLoading}
                  placeholder="+52 xxx xxx xxxx"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="company_address" className="text-sm font-medium">
                Dirección
              </Label>
              <Textarea
                id="company_address"
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                disabled={isLoading}
                placeholder="Calle, número, colonia, ciudad, estado, código postal"
                rows={3}
              />
            </div>
          </div>

          {/* Documentos legales */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos Legales</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company_terms_conditions" className="text-sm font-medium">
                  Términos y Condiciones
                </Label>
                <Textarea
                  id="company_terms_conditions"
                  value={formData.company_terms_conditions}
                  onChange={(e) => handleInputChange('company_terms_conditions', e.target.value)}
                  disabled={isLoading}
                  rows={6}
                  className="resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_privacy_policy" className="text-sm font-medium">
                  Política de Privacidad
                </Label>
                <Textarea
                  id="company_privacy_policy"
                  value={formData.company_privacy_policy}
                  onChange={(e) => handleInputChange('company_privacy_policy', e.target.value)}
                  disabled={isLoading}
                  rows={6}
                  className="resize-y"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={isLoading || isResetting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">🏢 Información importante</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Esta información se muestra en la aplicación y documentos oficiales</li>
            <li>• Los colores del tema se aplican en toda la interfaz</li>
            <li>• Los términos y políticas son visibles para todos los usuarios</li>
            <li>• Asegúrate de que toda la información sea actual y precisa</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
