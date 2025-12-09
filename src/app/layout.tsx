import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { GlobalQueryProvider } from '@/components/providers/GlobalQueryProvider'
import { getSEOSettings } from '@/lib/seo/settings'
import '@/lib/supabase/env' // Log del ambiente en consola

const inter = Inter({ subsets: ['latin'] })

// Detectar si está en desarrollo local (127.0.0.1 o IP local + puerto 54321)
const isLocal = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') || 
                process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(':54321')

// Metadatos dinámicos basados en system_settings
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSEOSettings()
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.fuegoextremo.com'
  
  return {
    title: seo.seo_title || 'REWAPP - Sistema de Recompensas',
    description: seo.seo_description || 'Plataforma de recompensas para múltiples sucursales',
    keywords: seo.seo_keywords,
    authors: seo.seo_author ? [{ name: seo.seo_author }] : undefined,
    icons: {
      icon: seo.favicon_url || '/favicon.ico',
      apple: seo.apple_touch_icon_url || undefined,
    },
    openGraph: {
      title: seo.seo_title,
      description: seo.seo_description,
      url: baseUrl,
      siteName: seo.company_name || 'REWAPP',
      images: seo.og_image_url ? [
        {
          url: seo.og_image_url,
          width: 1200,
          height: 630,
          alt: seo.seo_title,
        }
      ] : undefined,
      locale: 'es_MX',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.seo_title,
      description: seo.seo_description,
      images: seo.og_image_url ? [seo.og_image_url] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Indicador visual de ambiente LOCAL */}
        {isLocal && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-1 text-sm font-bold z-50">
            🏠 DESARROLLO LOCAL - Base de datos de prueba
          </div>
        )}
        {/* QueryClient global para toda la app (admin y client) */}
        <GlobalQueryProvider>
          <div className={isLocal ? 'mt-8' : ''}>
            {children}
          </div>
        </GlobalQueryProvider>
        <Toaster />
      </body>
    </html>
  )
}