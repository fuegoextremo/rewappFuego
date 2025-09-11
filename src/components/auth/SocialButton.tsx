/**
 * 🔗 SOCIAL AUTH BUTTON
 * Botón reutilizable para autenticación social (Google, Facebook)
 * Preparado para OAuth pero manejable sin claves configuradas
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
// import { createClientBrowser } from '@/lib/supabase/client' // Se usará cuando tengas las claves OAuth

interface SocialButtonProps {
  provider: 'google' | 'facebook'
  disabled?: boolean
  className?: string
}

export function SocialButton({ provider, disabled = false, className = '' }: SocialButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  // const supabase = createClientBrowser() // Se usará cuando tengas las claves OAuth

  const providerConfig = {
    google: {
      name: 'Google',
      icon: '🔍', // Usaremos emoji por ahora, después puede ser un icon component
      bgColor: 'bg-white border border-gray-300',
      textColor: 'text-gray-700',
      hoverColor: 'hover:bg-gray-50'
    },
    facebook: {
      name: 'Facebook',
      icon: '📘',
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      hoverColor: 'hover:bg-blue-700'
    }
  }

  const config = providerConfig[provider]

  const handleSocialAuth = async () => {
    setIsLoading(true)
    
    try {
      // Por ahora solo mostramos un mensaje
      // Cuando tengas las claves OAuth, aquí irá la lógica real
      toast({
        title: "OAuth no configurado",
        description: `Autenticación con ${config.name} estará disponible pronto. Por ahora usa email y contraseña.`,
        variant: "default"
      })

      // CÓDIGO PARA CUANDO TENGAS LAS CLAVES:
      /*
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }
      */

    } catch (error) {
      console.error(`Error en OAuth ${provider}:`, error)
      toast({
        title: "Error de autenticación",
        description: `No se pudo conectar con ${config.name}. Intenta más tarde.`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSocialAuth}
      disabled={disabled || isLoading}
      className={`
        w-full flex items-center justify-center gap-3 py-3
        ${config.bgColor} ${config.textColor} ${config.hoverColor}
        border-gray-300 transition-colors
        ${className}
      `}
    >
      <span className="text-lg">{config.icon}</span>
      {isLoading ? (
        <span>Conectando...</span>
      ) : (
        <span>Continuar con {config.name}</span>
      )}
    </Button>
  )
}
