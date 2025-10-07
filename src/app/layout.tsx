import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { GlobalQueryProvider } from '@/components/providers/GlobalQueryProvider'
import '@/lib/supabase/env' // Log del ambiente en consola

const inter = Inter({ subsets: ['latin'] })

// Detectar si está en desarrollo local (127.0.0.1 o IP local + puerto 54321)
const isLocal = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') || 
                process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(':54321')

export const metadata: Metadata = {
  title: 'REWAPP - Sistema de Recompensas',
  description: 'Plataforma de recompensas para múltiples sucursales',
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