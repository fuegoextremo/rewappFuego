import type { ReactNode } from 'react'
import { ReduxProvider } from '@/store/providers/ReduxProvider'
import { NavigationBlockProvider } from '@/components/providers/NavigationBlockProvider'
import { SpinLockDebugPanel } from '@/components/debug/SpinLockDebugPanel'
import { UnauthorizedBanner } from '@/components/shared/UnauthorizedBanner'
import { AdminPreviewBanner } from '@/components/shared/AdminPreviewBanner'
import { ClientThemeProvider } from '@/components/providers/ClientThemeProvider'
import { ClientProviders } from '@/components/providers/ClientProviders'
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
        <NavigationBlockProvider>
          <ClientProviders>
            <ClientThemeProvider>
            <div className="min-h-dvh bg-white text-gray-900">
              {/* Banners de estado */}
              <AdminPreviewBanner />
              
              {/* Header compacto estilo app 
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
*/}
                {/* Contenido */}
                <main className="pb-16">
                  {/* Banner de error dentro del main */}
                  <div className="px-4">
                    <UnauthorizedBanner />
                  </div>
                  {children}
                </main>
                
                {/* Panel de debug para desarrollo */}
                <SpinLockDebugPanel />
              </div>
            </ClientThemeProvider>
          </ClientProviders>
        </NavigationBlockProvider>
      </ReduxProvider>
    </>
  )
}