
import { Suspense } from "react";
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { getAdminSettings } from './actions';
import NotificacionesSection from '@/components/admin/settings/NotificacionesSection';
import EmpresaSection from '@/components/admin/settings/EmpresaSection';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Page() {
  const breadcrumbItems = [
    { label: 'Admin', href: '/admin/dashboard' },
    { label: 'Ajustes', current: true }
  ];

  const settingsResult = await getAdminSettings();

  if (!settingsResult.success) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Ajustes del Sistema</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configura los parámetros de la aplicación</p>
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
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ajustes del Sistema</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Configura los parámetros operativos de tu empresa y sistema de check-ins
        </p>
      </div>

      {/* Separador entre secciones */}
      <Suspense fallback={<div className="animate-pulse bg-gray-100 h-48 rounded-lg" />}>
        <NotificacionesSection 
          settings={('notifications' in settingsResult.data) ? settingsResult.data.notifications : []} 
        />
      </Suspense>

      <hr className="border-gray-200" />

      <Suspense fallback={<div className="animate-pulse bg-gray-100 h-96 rounded-lg" />}>
        <EmpresaSection 
          settings={('general' in settingsResult.data) ? settingsResult.data.general : []} 
        />
      </Suspense>
    </div>
  );
}
