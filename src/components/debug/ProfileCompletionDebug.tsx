/**
 * 🔧 COMPONENTE DEBUG: ProfileCompletionDebug  
 * Componente temporal para probar el flujo de completado de perfil
 */

'use client'

import { useUser } from '@/store/hooks'
import { useProfileCompletion } from '@/hooks/use-profile-completion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProfileCompletionDebug() {
  const user = useUser()
  
  // Adaptar el user para el hook
  const profileData = user ? {
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    birth_date: null // No tenemos birth_date en el store de Redux
  } : null
  
  const profileCompletion = useProfileCompletion(profileData)

  if (!user) return null

  return (
    <Card className="m-4 border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">🔧 Debug: Completado de Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-1">
          <p><strong>Nombre:</strong> {user.first_name || '❌ Falta'}</p>
          <p><strong>Apellido:</strong> {user.last_name || '❌ Falta'}</p>
          <p><strong>Teléfono:</strong> {user.phone || '❌ Falta'}</p>
        </div>
        
        <div className="text-sm bg-white p-2 rounded border">
          <p><strong>Necesita completado:</strong> {profileCompletion.needsCompletion ? '✅ Sí' : '❌ No'}</p>
          <p><strong>Campos faltantes:</strong> {profileCompletion.missingFieldsCount}</p>
          <p><strong>Crítico:</strong> {profileCompletion.needsCriticalCompletion ? '⚠️ Sí' : '✅ No'}</p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = '/complete-profile'}
            variant="outline"
            size="sm"
          >
            Ir a Completar Perfil
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            variant="outline" 
            size="sm"
          >
            Recargar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}