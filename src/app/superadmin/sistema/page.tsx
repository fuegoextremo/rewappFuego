import { Suspense } from "react";
import { getSuperAdminSettings } from "./actions";
import PremiosSection from "./components/PremiosSection";
import CuponesSection from "./components/CuponesSection";
import EmpresaSection from "./components/EmpresaSection";
import NotificacionesSection from "./components/NotificacionesSection";
import SEOSection from "./components/SEOSection";
import AnalyticsSection from "@/components/superadmin/AnalyticsSection";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CogIcon } from "@heroicons/react/24/outline";

export default async function SistemaPage() {
  const settingsResult = await getSuperAdminSettings();

  if (!settingsResult.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CogIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          </div>
          <p className="text-gray-600">Administra las configuraciones globales de la plataforma</p>
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CogIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        </div>
        <p className="text-gray-600">
          Administra las configuraciones globales de la plataforma. Estos ajustes afectan 
          el comportamiento de toda la aplicación.
        </p>
      </div>

      {/* Configuraciones */}
      <div className="space-y-8">
        {/* SEO y Branding - Lo más importante primero */}
        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-96 rounded-lg" />}>
          <SEOSection 
            settings={('seo' in settingsResult.data) ? settingsResult.data.seo : []} 
          />
        </Suspense>

        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-48 rounded-lg" />}>
          <PremiosSection 
            settings={('prizes' in settingsResult.data) ? settingsResult.data.prizes : []} 
          />
        </Suspense>

        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-32 rounded-lg" />}>
          <CuponesSection 
            settings={('coupons' in settingsResult.data) ? settingsResult.data.coupons : []} 
          />
        </Suspense>

        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-64 rounded-lg" />}>
          <AnalyticsSection 
            settings={('analytics' in settingsResult.data) ? settingsResult.data.analytics : []} 
          />
        </Suspense>

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
      <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Información importante</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Los cambios en configuraciones se aplican inmediatamente en toda la plataforma</li>
          <li>• Las configuraciones de premios y ruleta afectan las probabilidades de ganar</li>
          <li>• La información de empresa se muestra en términos, políticas y comunicaciones</li>
          <li>• Puedes resetear cualquier sección a valores por defecto si es necesario</li>
        </ul>
      </div>
    </div>
  );
}
