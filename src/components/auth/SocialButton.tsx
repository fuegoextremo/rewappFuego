/**
 * 🔗 SOCIAL AUTH BUTTON
 * Botón reutilizable      // VERIFICAR SI YA HAY SESIÓN ACTIVApara autenticación social (Google, Facebook)
 * Con diseño oficial de marcas y logos SVG
 */

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createClientBrowser } from '@/lib/supabase/client' // ✅ ACTIVADO

interface SocialButtonProps {
  provider: 'google' | 'facebook'
  disabled?: boolean
  className?: string
}

export function SocialButton({ provider, disabled = false, className = '' }: SocialButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientBrowser() // ✅ ACTIVADO

  const providerConfig = {
    google: {
      name: 'Google',
      icon: '/images/google_icon.svg',
      bgColor: 'bg-gray-50 border border-gray-300',
      textColor: 'text-gray-700',
      hoverColor: 'hover:bg-gray-100',
      text: 'Inicia sesión con Google',
      customBg: undefined as string | undefined
    },
    facebook: {
      name: 'Facebook',
      icon: '/images/facebook-logo.svg',
      bgColor: 'border-0',
      textColor: 'text-white hover:text-white',
      hoverColor: 'hover:bg-blue-700',
      text: 'Inicia sesión con Facebook',
      customBg: '#1877f2' as string | undefined
    }
  }

  const config = providerConfig[provider]

  const handleSocialAuth = async () => {
    setIsLoading(true)
    
    try {
      // � VERIFICAR SI YA HAY SESIÓN ACTIVA
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Si ya está logueado, ir al callback para validación
        console.log('Usuario ya logueado, validando perfil...')
        
        // Pequeña pausa para mostrar loading
        await new Promise(resolve => setTimeout(resolve, 800))
        
        window.location.href = '/auth/callback'
        return // No ejecutar setIsLoading(false) porque cambiamos de página
      }

      // SOLO SI NO HAY SESIÓN: HACER OAUTH
      console.log('No hay sesión, iniciando OAuth...')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback` // Callback universal
        }
      })

      if (error) {
        throw error
      }

      // OAuth iniciado exitosamente - la redirección externa maneja el resto
      console.log('OAuth iniciado, redirigiendo a Facebook...')

    } catch (error) {
      console.error(`Error en OAuth ${provider}:`, error)
      toast({
        title: "Error de autenticación",
        description: `No se pudo conectar con ${config.name}. Intenta de nuevo.`,
        variant: "destructive"
      })
      setIsLoading(false)
    }
    // No hacer setIsLoading(false) aquí porque ya estamos redirigiendo
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSocialAuth}
      disabled={disabled || isLoading}
      className={`
        w-full flex items-center justify-center gap-3 py-6 font-medium
        ${config.bgColor} ${config.textColor} ${config.hoverColor}
        transition-all duration-200 relative overflow-hidden
        rounded-xl
        ${className}
      `}
      style={config.customBg ? { backgroundColor: config.customBg } : undefined}
    >
      <Image 
        src={config.icon} 
        alt={`${config.name} logo`}
        width={20}
        height={20}
        className="flex-shrink-0"
      />
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Conectando...</span>
        </div>
      ) : (
        <span>{config.text}</span>
      )}
    </Button>
  )
}
