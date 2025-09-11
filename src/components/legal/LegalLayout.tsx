/**
 * 📄 LEGAL LAYOUT
 * Layout para páginas legales con branding consistente
 */

import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthBranding } from '@/hooks/use-auth-branding'

interface LegalLayoutProps {
  children: ReactNode
  title: string
  lastUpdated?: string
}

export function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  const { companyName, logoUrl, primaryColor, isLoading } = useAuthBranding()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo y nombre */}
            <div className="flex items-center space-x-3">
              {logoUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 p-1">
                  <Image
                    src={logoUrl}
                    alt={`Logo ${companyName}`}
                    width={40}
                    height={40}
                    className="object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-lg font-semibold text-gray-900">{companyName}</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Link 
                href="/legal/terms"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Términos
              </Link>
              <Link 
                href="/legal/privacy"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacidad
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Última actualización: {new Date(lastUpdated).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-sm text-gray-500">
              © 2025 {companyName}. Todos los derechos reservados.
            </p>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-sm transition-colors"
                style={{ color: primaryColor }}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="text-sm transition-colors"
                style={{ color: primaryColor }}
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
