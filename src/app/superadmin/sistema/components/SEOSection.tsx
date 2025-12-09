"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateSystemSettings, resetSettingsToDefault, type SystemSetting } from "../actions";
import { GlobeAltIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { ImageUploader } from "@/components/shared/ImageUploader";

interface SEOSectionProps {
  settings: SystemSetting[];
}

export default function SEOSection({ settings }: SEOSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  // Extraer valores actuales
  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const [formData, setFormData] = useState({
    seo_title: getSettingValue('seo_title', 'Fuego Extremo - Programa de Recompensas'),
    seo_description: getSettingValue('seo_description', 'Acumula puntos con cada visita, gira la ruleta y gana increíbles premios.'),
    seo_keywords: getSettingValue('seo_keywords', 'recompensas, puntos, ruleta, premios'),
    seo_author: getSettingValue('seo_author', ''),
    favicon_url: getSettingValue('favicon_url', ''),
    apple_touch_icon_url: getSettingValue('apple_touch_icon_url', ''),
    og_image_url: getSettingValue('og_image_url', ''),
    company_logo_url: getSettingValue('company_logo_url', ''),
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validaciones básicas
      if (!formData.seo_title.trim()) {
        throw new Error('El título SEO es obligatorio');
      }

      if (formData.seo_description.length > 160) {
        throw new Error('La descripción SEO no debe exceder 160 caracteres');
      }

      const result = await updateSystemSettings(formData);

      if (result.success) {
        toast({
          title: "¡SEO actualizado!",
          description: "Los cambios de SEO se aplicarán en la próxima recarga de la página",
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
      const result = await resetSettingsToDefault('seo');

      if (result.success) {
        setFormData({
          seo_title: 'Fuego Extremo - Programa de Recompensas',
          seo_description: 'Acumula puntos con cada visita, gira la ruleta y gana increíbles premios.',
          seo_keywords: 'recompensas, puntos, ruleta, premios',
          seo_author: '',
          favicon_url: '',
          apple_touch_icon_url: '',
          og_image_url: '',
          company_logo_url: '',
        });

        toast({
          title: "¡SEO reseteado!",
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
    <Card className="border-blue-200">
      <CardHeader className="bg-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GlobeAltIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900">SEO y Branding</CardTitle>
              <CardDescription className="text-blue-700">
                Configuración de metadatos, favicon, logo y redes sociales
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
        <div className="space-y-8">
          {/* Metadatos SEO */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              📝 Metadatos SEO
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title" className="text-sm font-medium">
                  Título SEO *
                </Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  disabled={isLoading}
                  placeholder="Mi App - Programa de Recompensas"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500">
                  {formData.seo_title.length}/60 caracteres • Aparece en la pestaña del navegador
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description" className="text-sm font-medium">
                  Descripción SEO
                </Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  disabled={isLoading}
                  placeholder="Descripción de tu aplicación para motores de búsqueda..."
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  {formData.seo_description.length}/160 caracteres • Aparece en resultados de Google
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_keywords" className="text-sm font-medium">
                    Palabras Clave
                  </Label>
                  <Input
                    id="seo_keywords"
                    value={formData.seo_keywords}
                    onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                    disabled={isLoading}
                    placeholder="recompensas, puntos, premios"
                  />
                  <p className="text-xs text-gray-500">Separadas por comas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_author" className="text-sm font-medium">
                    Autor / Empresa
                  </Label>
                  <Input
                    id="seo_author"
                    value={formData.seo_author}
                    onChange={(e) => handleInputChange('seo_author', e.target.value)}
                    disabled={isLoading}
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Imágenes de Branding */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              🎨 Imágenes de Branding
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <ImageUploader
                value={formData.company_logo_url}
                onChange={(url) => handleInputChange('company_logo_url', url)}
                fieldName="logo"
                label="Logo de la App"
                description="Se muestra en header, login y correos"
                recommendedSize="200x200"
                maxSizeBytes={2 * 1024 * 1024}
                previewWidth={120}
                previewHeight={120}
                disabled={isLoading}
              />

              {/* Favicon */}
              <ImageUploader
                value={formData.favicon_url}
                onChange={(url) => handleInputChange('favicon_url', url)}
                fieldName="favicon"
                label="Favicon"
                description="Icono en la pestaña del navegador"
                recommendedSize="32x32"
                maxSizeBytes={100 * 1024}
                allowedFormats={["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/ico"]}
                previewWidth={32}
                previewHeight={32}
                disabled={isLoading}
              />

              {/* Apple Touch Icon */}
              <ImageUploader
                value={formData.apple_touch_icon_url}
                onChange={(url) => handleInputChange('apple_touch_icon_url', url)}
                fieldName="apple-touch-icon"
                label="Apple Touch Icon"
                description="Icono para iOS cuando agregan a pantalla de inicio"
                recommendedSize="180x180"
                maxSizeBytes={500 * 1024}
                previewWidth={90}
                previewHeight={90}
                disabled={isLoading}
              />

              {/* OG Image */}
              <ImageUploader
                value={formData.og_image_url}
                onChange={(url) => handleInputChange('og_image_url', url)}
                fieldName="og-image"
                label="Imagen para Redes Sociales (OG)"
                description="Se muestra cuando comparten el link en Facebook, Twitter, etc."
                recommendedSize="1200x630"
                maxSizeBytes={5 * 1024 * 1024}
                previewWidth={200}
                previewHeight={105}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Preview SEO */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              👁️ Vista Previa en Google
            </h3>
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-1">
                {formData.favicon_url && (
                  <img 
                    src={formData.favicon_url} 
                    alt="favicon" 
                    className="w-4 h-4"
                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                  />
                )}
                <span className="text-sm text-gray-500">app.fuegoextremo.com</span>
              </div>
              <h4 className="text-xl text-blue-600 hover:underline cursor-pointer">
                {formData.seo_title || 'Título de la página'}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {formData.seo_description || 'Descripción de la página...'}
              </p>
            </div>
          </div>

          {/* Botón de guardar */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                "💾 Guardar Cambios SEO"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
