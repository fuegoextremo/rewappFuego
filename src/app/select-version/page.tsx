'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VersionSelectorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleVersionSelect = async (version: 'spa' | 'classic') => {
    setLoading(version)
    
    // Simular un pequeño delay para mostrar el loading
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Navegar a la versión seleccionada
    if (version === 'spa') {
      router.push('/client')
    } else {
      router.push('/client-classic')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🔥 Fuego Rewards
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Elige la versión de la aplicación que prefieres usar. 
            Puedes cambiar entre versiones en cualquier momento.
          </p>
        </div>

        {/* Version Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* SPA Version */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <span className="text-2xl">🚀</span>
                Versión SPA
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                  Recomendada
                </span>
              </CardTitle>
              <CardDescription className="text-green-700">
                Aplicación de una sola página - Experiencia fluida y moderna
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  Navegación instantánea
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  Pull-to-refresh
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  Mejor performance
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  Experiencia móvil nativa
                </div>
              </div>
              
              <Button 
                onClick={() => handleVersionSelect('spa')}
                disabled={!!loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading === 'spa' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cargando...
                  </div>
                ) : (
                  'Usar Versión SPA'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Classic Version */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <span className="text-2xl">🏛️</span>
                Versión Classic
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  Estable
                </span>
              </CardTitle>
              <CardDescription className="text-blue-700">
                Versión tradicional - Navegación por páginas estándar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✅</span>
                  Navegación tradicional
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✅</span>
                  URLs específicas
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✅</span>
                  Compatibilidad total
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✅</span>
                  Probada y estable
                </div>
              </div>
              
              <Button 
                onClick={() => handleVersionSelect('classic')}
                disabled={!!loading}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {loading === 'classic' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Cargando...
                  </div>
                ) : (
                  'Usar Versión Classic'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>💡 Puedes cambiar de versión en cualquier momento</p>
          <p>🔧 Si tienes problemas con una versión, prueba la otra</p>
        </div>
      </div>
    </div>
  )
}
