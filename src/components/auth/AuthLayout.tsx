/**
 * 🎨 AUTH LAYOUT COMPONENT
 * Layout reutilizable para todas las páginas de autenticación
 * Incluye branding dinámico, logo y colores desde system_settings
 */

import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthBranding } from '@/hooks/use-auth-branding'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showBackToHome?: boolean
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showBackToHome = false 
}: AuthLayoutProps) {
  const { companyName, logoUrl, primaryColor, isLoading } = useAuthBranding()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo y branding */}
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <div className="mb-4 w-40 h-40 rounded-3xl overflow-hidden bg-gray-100 flex items-center justify-center p-2">
              <Image
                src={logoUrl}
                alt={`Logo ${companyName}`}
                width={80}
                height={80}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          ) : (
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold mb-4 border border-gray-300"
              style={{ backgroundColor: primaryColor }}
            >
              {companyName.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 className="text-center text-3xl font-bold text-gray-900">
            {title}
          </h1>
          
          {subtitle && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Contenido del formulario */}
        <div className="bg-white py-8 px-4 rounded-xl sm:px-10">
          {children}
        </div>

        {/* Back to home link */}
        {showBackToHome && (
          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>© 2025 {companyName}. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}
