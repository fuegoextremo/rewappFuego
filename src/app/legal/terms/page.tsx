/**
 * 📄 TERMS AND CONDITIONS PAGE
 * Página de términos y condiciones dinámica
 */

'use client'

import { LegalLayout } from '@/components/legal/LegalLayout'
import { useSystemSettings } from '@/hooks/use-system-settings'

export default function TermsPage() {
  const { data: settings, isLoading } = useSystemSettings()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  const termsContent = settings?.company_terms_conditions || 'Términos y condiciones por definir...'
  const lastUpdated = new Date().toISOString() // En producción, esto vendría de la BD

  return (
    <LegalLayout 
      title="Términos y Condiciones"
      lastUpdated={lastUpdated}
    >
      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
        {termsContent}
      </div>
      
      {/* Sección adicional si no hay contenido personalizado */}
      {termsContent === 'Términos y condiciones por definir...' && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Contenido en desarrollo
          </h3>
          <p className="text-gray-600 mb-4">
            Los términos y condiciones específicos están siendo desarrollados. 
            Por el momento, se aplican las siguientes condiciones generales:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>El uso de esta aplicación está sujeto a las leyes locales aplicables</li>
            <li>Los usuarios deben proporcionar información veraz y actualizada</li>
            <li>El uso indebido de la plataforma puede resultar en la suspensión de la cuenta</li>
            <li>Los datos personales se manejan conforme a nuestra política de privacidad</li>
            <li>Nos reservamos el derecho de modificar estos términos en cualquier momento</li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            Para consultas específicas, contacta al administrador del sistema.
          </p>
        </div>
      )}
    </LegalLayout>
  )
}
