/**
 * 📄 PRIVACY POLICY PAGE
 * Página de política de privacidad dinámica
 */

'use client'

import { LegalLayout } from '@/components/legal/LegalLayout'
import { useSystemSettings } from '@/hooks/use-system-settings'

export default function PrivacyPage() {
  const { data: settings, isLoading } = useSystemSettings()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  const privacyContent = settings?.company_privacy_policy || 'Política de privacidad por definir...'
  const lastUpdated = new Date().toISOString() // En producción, esto vendría de la BD

  return (
    <LegalLayout 
      title="Política de Privacidad"
      lastUpdated={lastUpdated}
    >
      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
        {privacyContent}
      </div>
      
      {/* Sección adicional si no hay contenido personalizado */}
      {privacyContent === 'Política de privacidad por definir...' && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Compromiso con la Privacidad
          </h3>
          <p className="text-gray-600 mb-4">
            Aunque nuestra política de privacidad específica está en desarrollo, 
            nos comprometemos a proteger tus datos personales siguiendo estos principios:
          </p>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Información que recopilamos:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Nombre y apellidos</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Fecha de nacimiento</li>
                <li>Datos de uso de la aplicación</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cómo usamos tu información:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Para proporcionar y mejorar nuestros servicios</li>
                <li>Para comunicarnos contigo sobre tu cuenta</li>
                <li>Para personalizar tu experiencia</li>
                <li>Para cumplir con obligaciones legales</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Protección de datos:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Utilizamos cifrado para proteger datos sensibles</li>
                <li>Limitamos el acceso a tu información personal</li>
                <li>No vendemos tu información a terceros</li>
                <li>Cumplimos con las regulaciones de protección de datos aplicables</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tus derechos:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Acceder a tu información personal</li>
                <li>Corregir datos inexactos</li>
                <li>Solicitar la eliminación de tu cuenta</li>
                <li>Limitar el procesamiento de tus datos</li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Para ejercer tus derechos o hacer consultas sobre privacidad, contacta al administrador del sistema.
          </p>
        </div>
      )}
    </LegalLayout>
  )
}
