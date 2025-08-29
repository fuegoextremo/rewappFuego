
import { Suspense } from "react";
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { getAdminSettings } from './actions';
import NotificacionesSection from '@/components/admin/settings/NotificacionesSection';
import EmpresaSection from '@/components/admin/settings/EmpresaSection';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CogIcon } from "@heroicons/react/24/outline";

export default async function Page() {
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin/dashboard' },
    { label: 'Ajustes', current: true }
  ];

  const settingsResult = await getAdminSettings();

  if (!settingsResult.success) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CogIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Ajustes del Sistema</h1>
          </div>
          <p className="text-gray-600">Configura los parámetros de la aplicación</p>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error al cargar configuraciones</CardTitle>
            <CardDescription className="text-red-600">
              {settingsResult.error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <CogIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Ajustes del Sistema</h1>
          </div>
          <p className="text-gray-600">
            Configura los parámetros operativos de tu empresa y sistema de check-ins
          </p>
        </div>
      </div>

      {/* Configuraciones */}
      <div className="space-y-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-48 rounded-lg" />}>
          <NotificacionesSection 
            settings={('notifications' in settingsResult.data) ? settingsResult.data.notifications : []} 
          />
        </Suspense>

        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-96 rounded-lg" />}>
          <EmpresaSection 
            settings={('general' in settingsResult.data) ? settingsResult.data.general : []} 
          />
        </Suspense>
      </div>

      {/* Footer informativo */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Información importante</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Los cambios en configuraciones se aplican inmediatamente en toda la plataforma</li>
          <li>• Las configuraciones de check-ins afectan el comportamiento del sistema de puntos</li>
          <li>• La información de empresa se muestra en términos, políticas y comunicaciones</li>
          <li>• Puedes resetear cualquier sección a valores por defecto si es necesario</li>
        </ul>
      </div>
    </div>
  );
}
