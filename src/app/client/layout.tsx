import type { ReactNode } from 'react'
import { ReduxProvider } from '@/store/providers/ReduxProvider'
import { UnauthorizedBanner } from '@/components/shared/UnauthorizedBanner'
import { AdminPreviewBanner } from '@/components/shared/AdminPreviewBanner'
import { ClientThemeProvider } from '@/components/providers/ClientThemeProvider'
import { getSystemSettingsServer, generateCriticalCSS } from '@/lib/server/system-settings'
import '@/styles/client-shell.css'

export default async function ClientLayout({ children }: { children: ReactNode }) {
  // Obtener configuraciones del servidor antes del render
  const settings = await getSystemSettingsServer()
  const criticalCSS = generateCriticalCSS(settings)

  return (
    <>
      {/* CSS crítico inline para evitar flash de colores */}
      <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      
      <ReduxProvider>
        <ClientThemeProvider>
          <div className="mx-auto max-w-sm min-h-dvh bg-white text-gray-900">
            {/* Banners de estado */}
            <AdminPreviewBanner />
            
            {/* Header compacto estilo app */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
              <div className="px-4 py-3">
                <h1 className="text-lg font-semibold">
                  Fuego Rewards <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">v2.0</span>
                </h1>
                <p className="text-xs text-gray-500">
                  ¡Registra tus visitas y participa en la ruleta!
                </p>
              </div>
            </header>

            {/* Contenido */}
            <main className="pb-20">
              {/* Banner de error dentro del main */}
              <div className="px-4 pt-4">
                <UnauthorizedBanner />
              </div>
              {children}
            </main>
          </div>
        </ClientThemeProvider>
      </ReduxProvider>
    </>
  )
}