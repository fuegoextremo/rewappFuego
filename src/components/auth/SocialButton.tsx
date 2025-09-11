/**
 * 🔗 SOCIAL AUTH BUTTON
 * Botón reutilizable para autenticación social (Google, Facebook)
 * Con diseño oficial de marcas y logos SVG
 */

import { useState } from 'react'
import Image from 'next/image'
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
        <span>Conectando...</span>
      ) : (
        <span>{config.text}</span>
      )}
    </Button>
  )
}
