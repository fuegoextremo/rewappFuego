"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  updateSystemSettings,
  resetSettingsToDefault,
  getWelcomePrizes,
  createWelcomePrize,
  updateWelcomePrize,
  deactivateWelcomePrize,
  type SystemSetting,
  type WelcomePrize,
} from "../actions";
import { BuildingOfficeIcon, ArrowPathIcon, PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmpresaSectionProps {
  settings: SystemSetting[];
}

export default function EmpresaSection({ settings }: EmpresaSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  // --- Estado del mini-CRUD de premios de bienvenida ---
  const [welcomePrizes, setWelcomePrizes] = useState<WelcomePrize[]>([]);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeDesc, setNewPrizeDesc] = useState('');
  const [isSavingPrize, setIsSavingPrize] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadWelcomePrizes = useCallback(async () => {
    const result = await getWelcomePrizes();
    if (result.success) setWelcomePrizes(result.data);
  }, []);

  useEffect(() => { loadWelcomePrizes(); }, [loadWelcomePrizes]);

  const handleCreatePrize = async () => {
    if (!newPrizeName.trim()) return;
    setIsSavingPrize(true);
    const result = await createWelcomePrize(newPrizeName, newPrizeDesc);
    if (result.success && result.data) {
      setWelcomePrizes(prev => [result.data!, ...prev]);
      setNewPrizeName('');
      setNewPrizeDesc('');
      toast({ title: 'Premio creado' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsSavingPrize(false);
  };

  const handleEditSave = async (id: string) => {
    if (!editName.trim()) return;
    setIsSavingPrize(true);
    const result = await updateWelcomePrize(id, editName, editDesc);
    if (result.success) {
      setWelcomePrizes(prev => prev.map(p => p.id === id ? { ...p, name: editName, description: editDesc || null } : p));
      setEditingId(null);
      toast({ title: 'Premio actualizado' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsSavingPrize(false);
  };

  const handleDeactivate = async (id: string) => {
    const result = await deactivateWelcomePrize(id);
    if (result.success) {
      setWelcomePrizes(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
      if (formData.welcome_coupon_prize_id === id) {
        handleInputChange('welcome_coupon_prize_id', '');
      }
      toast({ title: 'Premio desactivado' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  // Extraer valores actuales
  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  // Obtener logo desde settings (se configura en SEO y Branding)
  const companyLogoUrl = getSettingValue('company_logo_url', '');

  const [formData, setFormData] = useState({
    company_name: getSettingValue('company_name', 'Mi Empresa'),
    company_theme_primary: getSettingValue('company_theme_primary', '#8b5cf6'),
    company_theme_secondary: getSettingValue('company_theme_secondary', '#a855f7'),
    company_contact_email: getSettingValue('company_contact_email', ''),
    company_contact_phone: getSettingValue('company_contact_phone', ''),
    company_address: getSettingValue('company_address', ''),
    company_terms_conditions: getSettingValue('company_terms_conditions', 'Términos y condiciones por definir...'),
    company_privacy_policy: getSettingValue('company_privacy_policy', 'Política de privacidad por definir...'),
    enable_google_login: getSettingValue('enable_google_login', 'false'),
    enable_facebook_login: getSettingValue('enable_facebook_login', 'false'),
    welcome_coupon_enabled: getSettingValue('welcome_coupon_enabled', 'false'),
    welcome_coupon_prize_id: getSettingValue('welcome_coupon_prize_id', ''),
    welcome_coupon_expiry_mode: getSettingValue('welcome_coupon_expiry_mode', 'days'),
    welcome_coupon_expiry_days: getSettingValue('welcome_coupon_expiry_days', '30'),
    welcome_coupon_expiry_date: getSettingValue('welcome_coupon_expiry_date', ''),
    welcome_coupon_campaign_end: getSettingValue('welcome_coupon_campaign_end', ''),
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
        throw new Error('El email de contacto no es válido');
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
      const result = await resetSettingsToDefault('general');

      if (result.success) {
        // Actualizar el formulario con valores por defecto
        setFormData({
          company_name: 'Mi Empresa',
          company_theme_primary: '#8b5cf6',
          company_theme_secondary: '#a855f7',
          company_contact_email: '',
          company_contact_phone: '',
          company_address: '',
          company_terms_conditions: 'Términos y condiciones por definir...',
          company_privacy_policy: 'Política de privacidad por definir...',
          enable_google_login: 'false',
          enable_facebook_login: 'false',
          welcome_coupon_enabled: 'false',
          welcome_coupon_prize_id: '',
          welcome_coupon_expiry_mode: 'days',
          welcome_coupon_expiry_days: '30',
          welcome_coupon_expiry_date: '',
          welcome_coupon_campaign_end: '',
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
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle className="text-blue-800">Configuración de la Empresa</CardTitle>
              <CardDescription className="text-blue-600">
                Información corporativa, tema visual y documentos legales
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isLoading}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {isResetting ? "Reseteando..." : "Resetear"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Información básica */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">
                Nombre de la empresa *
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className="border-blue-200 focus:border-blue-400"
                disabled={isLoading}
                placeholder="Nombre de tu empresa"
              />
              <p className="text-xs text-gray-500 mt-1">
                El logo se configura en la seccion SEO y Branding
              </p>
            </div>
          </div>
        </div>

        {/* Tema visual */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-4">Tema Visual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primary_color" className="text-sm font-medium text-gray-700">
                Color primario
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.company_theme_primary}
                  onChange={(e) => handleInputChange('company_theme_primary', e.target.value)}
                  className="w-16 h-10 border-blue-200"
                  disabled={isLoading}
                />
                <Input
                  value={formData.company_theme_primary}
                  onChange={(e) => handleInputChange('company_theme_primary', e.target.value)}
                  className="flex-1 border-blue-200 focus:border-blue-400"
                  disabled={isLoading}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color" className="text-sm font-medium text-gray-700">
                Color secundario
              </Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.company_theme_secondary}
                  onChange={(e) => handleInputChange('company_theme_secondary', e.target.value)}
                  className="w-16 h-10 border-blue-200"
                  disabled={isLoading}
                />
                <Input
                  value={formData.company_theme_secondary}
                  onChange={(e) => handleInputChange('company_theme_secondary', e.target.value)}
                  className="flex-1 border-blue-200 focus:border-blue-400"
                  disabled={isLoading}
                  placeholder="#a855f7"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-sm font-medium text-gray-700">
                Email de contacto
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.company_contact_email}
                onChange={(e) => handleInputChange('company_contact_email', e.target.value)}
                className="border-blue-200 focus:border-blue-400"
                disabled={isLoading}
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="text-sm font-medium text-gray-700">
                Teléfono de contacto
              </Label>
              <Input
                id="contact_phone"
                value={formData.company_contact_phone}
                onChange={(e) => handleInputChange('company_contact_phone', e.target.value)}
                className="border-blue-200 focus:border-blue-400"
                disabled={isLoading}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Dirección
              </Label>
              <Input
                id="address"
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                className="border-blue-200 focus:border-blue-400"
                disabled={isLoading}
                placeholder="Dirección completa de la empresa"
              />
            </div>
          </div>
        </div>

        {/* Documentos legales */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-4">Documentos Legales</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="terms" className="text-sm font-medium text-gray-700">
                Términos y Condiciones
              </Label>
              <Textarea
                id="terms"
                value={formData.company_terms_conditions}
                onChange={(e) => handleInputChange('company_terms_conditions', e.target.value)}
                className="border-blue-200 focus:border-blue-400 min-h-32"
                disabled={isLoading}
                placeholder="Escriba aquí los términos y condiciones de su empresa..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy" className="text-sm font-medium text-gray-700">
                Política de Privacidad
              </Label>
              <Textarea
                id="privacy"
                value={formData.company_privacy_policy}
                onChange={(e) => handleInputChange('company_privacy_policy', e.target.value)}
                className="border-blue-200 focus:border-blue-400 min-h-32"
                disabled={isLoading}
                placeholder="Escriba aquí la política de privacidad de su empresa..."
              />
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="bg-white/50 p-6 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-4">Vista previa de la empresa:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {companyLogoUrl && (
                  <Image 
                    src={companyLogoUrl} 
                    alt="Logo" 
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <span className="font-semibold text-blue-700 text-lg">
                  {formData.company_name}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-gray-600">📧 {formData.company_contact_email || 'Sin email'}</p>
                <p className="text-gray-600">📞 {formData.company_contact_phone || 'Sin teléfono'}</p>
                <p className="text-gray-600">📍 {formData.company_address || 'Sin dirección'}</p>
              </div>
            </div>
            <div>
              <div className="mb-3">
                <span className="text-sm text-gray-600">Colores del tema:</span>
                <div className="flex gap-2 mt-1">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: formData.company_theme_primary }}
                    title="Color primario"
                  />
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: formData.company_theme_secondary }}
                    title="Color secundario"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autenticacion social */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-4">Autenticacion Social</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium text-gray-800">Boton de Google</p>
                <p className="text-xs text-gray-500">Mostrar opcion de inicio de sesion con Google</p>
              </div>
              <Switch
                checked={formData.enable_google_login === 'true'}
                onCheckedChange={(checked) => handleInputChange('enable_google_login', checked ? 'true' : 'false')}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium text-gray-800">Boton de Facebook</p>
                <p className="text-xs text-gray-500">Mostrar opcion de inicio de sesion con Facebook</p>
              </div>
              <Switch
                checked={formData.enable_facebook_login === 'true'}
                onCheckedChange={(checked) => handleInputChange('enable_facebook_login', checked ? 'true' : 'false')}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Cupon de bienvenida */}
        <div>
          <h3 className="font-semibold text-blue-800 mb-4">Cupon de Bienvenida</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium text-gray-800">Activar cupon de bienvenida</p>
                <p className="text-xs text-gray-500">Regalar un cupon al completar el registro por primera vez</p>
              </div>
              <Switch
                checked={formData.welcome_coupon_enabled === 'true'}
                onCheckedChange={(checked) => handleInputChange('welcome_coupon_enabled', checked ? 'true' : 'false')}
                disabled={isLoading}
              />
            </div>

            {/* Mini-CRUD: premios de bienvenida */}
            <div className="p-4 bg-white rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Premios de bienvenida</Label>
                <span className="text-xs text-gray-400">Solo type=welcome • soft-delete</span>
              </div>

              {welcomePrizes.length > 0 && (
                <div className="space-y-2">
                  {welcomePrizes.map((prize) => (
                    <div key={prize.id} className={`rounded-lg border px-3 py-2 text-sm ${
                      prize.is_active ? 'border-blue-100 bg-blue-50' : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}>
                      {editingId === prize.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nombre"
                            className="text-sm h-8 border-blue-200"
                            disabled={isSavingPrize}
                          />
                          <Textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Descripcion (opcional)"
                            rows={2}
                            className="text-sm resize-none border-blue-200"
                            disabled={isSavingPrize}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => handleEditSave(prize.id)} disabled={isSavingPrize}>
                              Guardar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{prize.name}</p>
                            {prize.description && <p className="text-xs text-gray-500 truncate">{prize.description}</p>}
                            {!prize.is_active && <span className="text-xs text-gray-400">(inactivo)</span>}
                          </div>
                          {prize.is_active && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => { setEditingId(prize.id); setEditName(prize.name); setEditDesc(prize.description ?? ''); }}
                                className="p-1 text-blue-400 hover:text-blue-700 rounded"
                                title="Editar"
                              >
                                <PencilIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeactivate(prize.id)}
                                className="p-1 text-blue-400 hover:text-red-500 rounded"
                                title="Desactivar"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-1 border-t border-blue-100">
                <p className="text-xs font-medium text-gray-500">Nuevo premio</p>
                <Input
                  value={newPrizeName}
                  onChange={(e) => setNewPrizeName(e.target.value)}
                  placeholder="Nombre del premio *"
                  className="border-blue-200 focus:border-blue-400"
                  disabled={isSavingPrize}
                />
                <Textarea
                  value={newPrizeDesc}
                  onChange={(e) => setNewPrizeDesc(e.target.value)}
                  placeholder="Descripcion (opcional)"
                  rows={2}
                  className="resize-none border-blue-200 focus:border-blue-400"
                  disabled={isSavingPrize}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={handleCreatePrize}
                  disabled={isSavingPrize || !newPrizeName.trim()}
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Agregar premio
                </Button>
              </div>
            </div>

            {/* Dropdown: seleccionar cual es el activo para el cupon */}
            <div className="p-4 bg-white rounded-lg border border-blue-200 space-y-2">
              <Label className="text-sm font-medium text-gray-700">Premio activo del cupon</Label>
              <p className="text-xs text-gray-500">El premio que recibe el usuario al registrarse</p>
              <Select
                value={formData.welcome_coupon_prize_id}
                onValueChange={(value) => handleInputChange('welcome_coupon_prize_id', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Selecciona un premio de bienvenida" />
                </SelectTrigger>
                <SelectContent>
                  {welcomePrizes.filter(p => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-white rounded-lg border border-blue-200 space-y-3">
              <Label className="text-sm font-medium text-gray-700">Modo de expiracion del cupon</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="expiry_mode_sa"
                    value="days"
                    checked={formData.welcome_coupon_expiry_mode === 'days'}
                    onChange={() => handleInputChange('welcome_coupon_expiry_mode', 'days')}
                    disabled={isLoading}
                  />
                  Por dias
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="expiry_mode_sa"
                    value="fixed_date"
                    checked={formData.welcome_coupon_expiry_mode === 'fixed_date'}
                    onChange={() => handleInputChange('welcome_coupon_expiry_mode', 'fixed_date')}
                    disabled={isLoading}
                  />
                  Fecha fija
                </label>
              </div>

              {formData.welcome_coupon_expiry_mode === 'days' && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Dias de validez</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.welcome_coupon_expiry_days}
                    onChange={(e) => handleInputChange('welcome_coupon_expiry_days', e.target.value)}
                    disabled={isLoading}
                    className="w-32 border-blue-200 focus:border-blue-400"
                  />
                </div>
              )}

              {formData.welcome_coupon_expiry_mode === 'fixed_date' && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    Fecha de expiracion — si ya paso, no se generan cupones nuevos
                  </Label>
                  <Input
                    type="date"
                    value={formData.welcome_coupon_expiry_date}
                    onChange={(e) => handleInputChange('welcome_coupon_expiry_date', e.target.value)}
                    disabled={isLoading}
                    className="w-48 border-blue-200 focus:border-blue-400"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-white rounded-lg border border-blue-200 space-y-2">
              <Label className="text-sm font-medium text-gray-700">Fin de campana</Label>
              <p className="text-xs text-gray-500">Fecha limite para otorgar el cupon. Dejar vacio para sin limite.</p>
              <Input
                type="date"
                value={formData.welcome_coupon_campaign_end}
                onChange={(e) => handleInputChange('welcome_coupon_campaign_end', e.target.value)}
                disabled={isLoading}
                className="w-48 border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Boton de guardar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isLoading || isResetting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Guardando..." : "Guardar Configuracion"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
