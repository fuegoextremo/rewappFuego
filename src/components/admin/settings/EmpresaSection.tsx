"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "../../../app/admin/settings/actions";
import { ArrowPathIcon, PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ImageUploader } from "@/components/shared/ImageUploader";
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
      // Si estaba seleccionado, limpiar el selector
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
        throw new Error('El email de contacto debe tener un formato válido');
      }

      // Si hay titulo, crear/actualizar el premio de bienvenida aislado primero
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
        enable_google_login: formData.enable_google_login,
        enable_facebook_login: formData.enable_facebook_login,
        welcome_coupon_enabled: formData.welcome_coupon_enabled,
        welcome_coupon_prize_id: formData.welcome_coupon_prize_id,
        welcome_coupon_expiry_mode: formData.welcome_coupon_expiry_mode,
        welcome_coupon_expiry_days: formData.welcome_coupon_expiry_days,
        welcome_coupon_expiry_date: formData.welcome_coupon_expiry_date,
        welcome_coupon_campaign_end: formData.welcome_coupon_campaign_end,
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
          enable_google_login: 'false',
          enable_facebook_login: 'false',
          welcome_coupon_enabled: 'false',
          welcome_coupon_prize_id: '',
          welcome_coupon_expiry_mode: 'days',
          welcome_coupon_expiry_days: '30',
          welcome_coupon_expiry_date: '',
          welcome_coupon_campaign_end: '',
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

      {/* Grupo: autenticacion social */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Autenticacion social</p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white">
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
          <div className="flex items-center justify-between px-4 py-3 bg-white">
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

      {/* Grupo: cupon de bienvenida */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Cupon de bienvenida</p>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white">
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

          {/* Mini-CRUD: lista de premios de bienvenida */}
          <div className="px-4 py-3 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-800">Premios de bienvenida</Label>
              <span className="text-xs text-gray-400">Solo type=welcome • soft-delete</span>
            </div>

            {/* Lista */}
            {welcomePrizes.length > 0 && (
              <div className="space-y-2">
                {welcomePrizes.map((prize) => (
                  <div key={prize.id} className={`rounded-lg border px-3 py-2 text-sm ${
                    prize.is_active ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-50'
                  }`}>
                    {editingId === prize.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nombre"
                          className="text-sm h-8"
                          disabled={isSavingPrize}
                        />
                        <Textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Descripcion (opcional)"
                          rows={2}
                          className="text-sm resize-none"
                          disabled={isSavingPrize}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleEditSave(prize.id)} disabled={isSavingPrize}>
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
                              className="p-1 text-gray-400 hover:text-gray-700 rounded"
                              title="Editar"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeactivate(prize.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
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

            {/* Formulario de creacion */}
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500">Nuevo premio</p>
              <Input
                value={newPrizeName}
                onChange={(e) => setNewPrizeName(e.target.value)}
                placeholder="Nombre del premio *"
                className="text-sm"
                disabled={isSavingPrize}
              />
              <Textarea
                value={newPrizeDesc}
                onChange={(e) => setNewPrizeDesc(e.target.value)}
                placeholder="Descripcion (opcional)"
                rows={2}
                className="text-sm resize-none"
                disabled={isSavingPrize}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={handleCreatePrize}
                disabled={isSavingPrize || !newPrizeName.trim()}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Agregar premio
              </Button>
            </div>
          </div>

          {/* Dropdown: seleccionar cual es el activo para el cupon */}
          <div className="px-4 py-3 bg-white space-y-1.5">
            <Label className="text-sm font-medium text-gray-800">Premio activo del cupon</Label>
            <p className="text-xs text-gray-500">El premio que recibe el usuario al registrarse</p>
            <Select
              value={formData.welcome_coupon_prize_id}
              onValueChange={(value) => handleInputChange('welcome_coupon_prize_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Selecciona un premio de bienvenida" />
              </SelectTrigger>
              <SelectContent>
                {welcomePrizes.filter(p => p.is_active).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="px-4 py-3 bg-white space-y-2">
            <Label className="text-sm font-medium text-gray-800">Modo de expiracion del cupon</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="expiry_mode"
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
                  name="expiry_mode"
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
                <Label htmlFor="welcome_expiry_days" className="text-xs text-gray-600">Dias de validez</Label>
                <Input
                  id="welcome_expiry_days"
                  type="number"
                  min="1"
                  value={formData.welcome_coupon_expiry_days}
                  onChange={(e) => handleInputChange('welcome_coupon_expiry_days', e.target.value)}
                  disabled={isLoading}
                  className="w-32 text-sm"
                />
              </div>
            )}

            {formData.welcome_coupon_expiry_mode === 'fixed_date' && (
              <div className="space-y-1">
                <Label htmlFor="welcome_expiry_date" className="text-xs text-gray-600">
                  Fecha de expiracion — si ya paso, no se generan cupones nuevos
                </Label>
                <Input
                  id="welcome_expiry_date"
                  type="date"
                  value={formData.welcome_coupon_expiry_date}
                  onChange={(e) => handleInputChange('welcome_coupon_expiry_date', e.target.value)}
                  disabled={isLoading}
                  className="w-48 text-sm"
                />
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-white space-y-1.5">
            <Label htmlFor="welcome_campaign_end" className="text-sm font-medium text-gray-800">Fin de campana</Label>
            <p className="text-xs text-gray-500">Fecha limite para otorgar el cupon. Dejar vacio para sin limite.</p>
            <Input
              id="welcome_campaign_end"
              type="date"
              value={formData.welcome_coupon_campaign_end}
              onChange={(e) => handleInputChange('welcome_coupon_campaign_end', e.target.value)}
              disabled={isLoading}
              className="w-48 text-sm"
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
