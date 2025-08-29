'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Eye, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

export function AdminPreviewBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isAdminView, setIsAdminView] = useState(false)
  
  useEffect(() => {
    // Verificar si estamos en modo admin preview
    const adminParam = searchParams.get('admin') === 'true'
    const isClientRoute = pathname.startsWith('/client')
    
    // Si estamos en una ruta de cliente Y tenemos el parámetro admin, o si ya estábamos en vista admin
    if ((isClientRoute && adminParam) || (isClientRoute && sessionStorage.getItem('adminPreview') === 'true')) {
      setIsAdminView(true)
      sessionStorage.setItem('adminPreview', 'true')
    } else if (!isClientRoute) {
      setIsAdminView(false)
      sessionStorage.removeItem('adminPreview')
    }
  }, [searchParams, pathname])
  
  if (!isAdminView) return null
  
  const handleGoBack = () => {
    sessionStorage.removeItem('adminPreview')
    router.push('/admin/dashboard')
  }
  
  return (
    <div className="bg-amber-500 text-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <Eye className="h-5 w-5" />
          <span className="font-medium">
            Vista de Cliente - Estás navegando como Admin
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleGoBack}
          className="bg-white text-amber-600 border-white hover:bg-amber-50 hover:text-amber-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Admin
        </Button>
      </div>
    </div>
  )
}
