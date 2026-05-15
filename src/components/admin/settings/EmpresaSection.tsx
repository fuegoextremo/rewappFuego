"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateSystemSettings, resetSettingsToDefault, type SystemSetting } from "../../../app/admin/settings/actions";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { ImageUploader } from "@/components/shared/ImageUploader";

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
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Empresa</p>
          <h2 className="text-base font-semibold text-gray-900">Configuración de la Empresa</h2>
          <p className="text-sm text-gray-500 mt-0.5">Información corporativa, branding y documentos legales</p>
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

      {/* Grupo: información básica */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Información básica</p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-white space-y-1.5">
            <Label htmlFor="company_name" className="text-sm font-medium text-gray-800">
              Nombre de la empresa <span className="text-gray-400 font-normal">*</span>
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              disabled={isLoading}
              placeholder="Mi Empresa"
              className="text-sm"
            />
          </div>

          <div className="px-4 py-3 bg-white space-y-1.5">
            <ImageUploader
              label="Logo de la empresa"
              description="Imagen que aparece en la aplicación y documentos"
              fieldName="company_logo"
              bucket="branding"
              value={formData.company_logo_url}
              onChange={(url) => handleInputChange('company_logo_url', url)}
              disabled={isLoading}
              previewWidth={120}
              previewHeight={60}
              recommendedSize="200x80"
            />
          </div>
        </div>
      </div>

      {/* Grupo: colores del tema */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Colores del tema</p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 bg-white">
            <div className="flex-1 min-w-0">
              <Label htmlFor="company_theme_primary" className="text-sm font-medium text-gray-800">
                Color primario
              </Label>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                id="company_theme_primary"
                type="color"
                value={formData.company_theme_primary}
                onChange={(e) => handleInputChange('company_theme_primary', e.target.value)}
                disabled={isLoading}
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <Input
                value={formData.company_theme_primary}
                onChange={(e) => handleInputChange('company_theme_primary', e.target.value)}
                disabled={isLoading}
                placeholder="#8b5cf6"
                className="w-28 text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 py-3 bg-white">
            <div className="flex-1 min-w-0">
              <Label htmlFor="company_theme_secondary" className="text-sm font-medium text-gray-800">
                Color secundario
              </Label>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                id="company_theme_secondary"
                type="color"
                value={formData.company_theme_secondary}
                onChange={(e) => handleInputChange('company_theme_secondary', e.target.value)}
                disabled={isLoading}
                className="w-10 h-8 p-1 cursor-pointer"
              />
              <Input
                value={formData.company_theme_secondary}
                onChange={(e) => handleInputChange('company_theme_secondary', e.target.value)}
                disabled={isLoading}
                placeholder="#a855f7"
                className="w-28 text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grupo: contacto */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Contacto</p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-white space-y-1.5">
            <Label htmlFor="company_contact_email" className="text-sm font-medium text-gray-800">Email</Label>
            <Input
              id="company_contact_email"
              type="email"
              value={formData.company_contact_email}
              onChange={(e) => handleInputChange('company_contact_email', e.target.value)}
              disabled={isLoading}
              placeholder="contacto@miempresa.com"
              className="text-sm"
            />
          </div>

          <div className="px-4 py-3 bg-white space-y-1.5">
            <Label htmlFor="company_contact_phone" className="text-sm font-medium text-gray-800">Teléfono</Label>
            <Input
              id="company_contact_phone"
              value={formData.company_contact_phone}
              onChange={(e) => handleInputChange('company_contact_phone', e.target.value)}
              disabled={isLoading}
              placeholder="+52 xxx xxx xxxx"
              className="text-sm"
            />
          </div>

          <div className="px-4 py-3 bg-white space-y-1.5">
            <Label htmlFor="company_address" className="text-sm font-medium text-gray-800">Dirección</Label>
            <Textarea
              id="company_address"
              value={formData.company_address}
              onChange={(e) => handleInputChange('company_address', e.target.value)}
              disabled={isLoading}
              placeholder="Calle, número, colonia, ciudad, estado, código postal"
              rows={3}
              className="text-sm resize-y"
            />
          </div>
        </div>
      </div>

      {/* Grupo: documentos legales */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Documentos legales</p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-white space-y-1.5">
            <Label htmlFor="company_terms_conditions" className="text-sm font-medium text-gray-800">
              Términos y condiciones
            </Label>
            <Textarea
              id="company_terms_conditions"
              value={formData.company_terms_conditions}
              onChange={(e) => handleInputChange('company_terms_conditions', e.target.value)}
              disabled={isLoading}
              rows={6}
              className="text-sm resize-y"
            />
          </div>

          <div className="px-4 py-3 bg-white space-y-1.5">
            <Label htmlFor="company_privacy_policy" className="text-sm font-medium text-gray-800">
              Política de privacidad
            </Label>
            <Textarea
              id="company_privacy_policy"
              value={formData.company_privacy_policy}
              onChange={(e) => handleInputChange('company_privacy_policy', e.target.value)}
              disabled={isLoading}
              rows={6}
              className="text-sm resize-y"
            />
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
