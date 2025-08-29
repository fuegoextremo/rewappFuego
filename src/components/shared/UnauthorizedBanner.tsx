'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'

export function UnauthorizedBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const from = searchParams.get('from')
  
  if (error !== 'unauthorized') return null
  
  const handleDismiss = () => {
    // Limpiar query params
    const url = new URL(window.location.href)
    url.searchParams.delete('error')
    url.searchParams.delete('from')
    router.replace(url.pathname)
  }
  
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Acceso no autorizado
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              No tienes permisos para acceder a <code className="bg-red-100 px-1 rounded">{from}</code>. 
              Te hemos redirigido a tu área correspondiente.
            </p>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDismiss}
            className="text-red-400 hover:text-red-600 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
