import { useEffect } from 'react'
import { useSimpleAppStore } from '@/stores/simple-app-store'
import { createClientBrowser } from '@/lib/supabase/client'

// Función para cargar solo el perfil básico del usuario
async function loadBasicProfile(userId: string) {
  const supabase = createClientBrowser()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, role')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error loading basic profile:', error)
    return null
  }
  
  // Agregar email desde auth si existe
  return {
    ...data,
    email: userId // El ID suele ser el email en Supabase
  }
}

// Función para cargar configuraciones básicas
async function loadBasicSettings() {
  const supabase = createClientBrowser()
  
  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('is_active', true)
  
  if (data) {
    return data.reduce((acc: Record<string, string>, { key, value }) => {
      acc[key] = value
      return acc
    }, {})
  }
  
  return {}
}

export function useSimpleAuth() {
  const { setUser, setSettings, reset } = useSimpleAppStore()
  const { user, isAuthenticated } = useSimpleAppStore()

  useEffect(() => {
    const supabase = createClientBrowser()

    // Manejar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Loading basic profile...')
          
          // Cargar perfil básico y configuraciones en paralelo
          const [profile, settings] = await Promise.all([
            loadBasicProfile(session.user.id),
            loadBasicSettings()
          ])
          
          if (profile) {
            setUser(profile)
            setSettings(settings)
            console.log('✅ User authenticated and profile loaded')
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          reset()
        }
      }
    )

    // Verificar sesión inicial
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user && !user) {
        console.log('Loading initial session...')
        
        const [profile, settings] = await Promise.all([
          loadBasicProfile(session.user.id),
          loadBasicSettings()
        ])
        
        if (profile) {
          setUser(profile)
          setSettings(settings)
        }
      }
    }
    
    checkInitialSession()

    return () => subscription.unsubscribe()
  }, [setUser, setSettings, reset, user])

  return {
    user,
    isAuthenticated,
    loading: false // Simplificado - no estado de loading complejo
  }
}
