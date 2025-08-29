import { Suspense } from "react";
import { getAdminNotificationSettings } from "./actions";
import AdminNotificacionesSection from "./components/AdminNotificacionesSection";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CogIcon } from "@heroicons/react/24/outline";

export default async function ConfiguracionesPage() {
  const settingsResult = await getAdminNotificationSettings();

  if (!settingsResult.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CogIcon className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuraciones</h1>
          </div>
          <p className="text-gray-600">Administra las configuraciones operativas de tu empresa</p>
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
          <CogIcon className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuraciones</h1>
        </div>
        <p className="text-gray-600">
          Administra las configuraciones operativas de tu empresa. Estos ajustes afectan 
          el comportamiento diario de la aplicación.
        </p>
      </div>

      {/* Configuraciones */}
      <div className="space-y-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-48 rounded-lg" />}>
          <AdminNotificacionesSection 
            settings={settingsResult.data} 
          />
        </Suspense>
      </div>

      {/* Footer informativo */}
      <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Información importante</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Los cambios en configuraciones se aplican inmediatamente</li>
          <li>• Los puntos por check-in motivan la participación de los usuarios</li>
          <li>• El límite diario ayuda a mantener un uso equilibrado del sistema</li>
          <li>• Puedes resetear las configuraciones a valores por defecto si es necesario</li>
        </ul>
      </div>
    </div>
  );
}
