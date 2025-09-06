import { useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { createClientBrowser } from '@/lib/supabase/client'
import { useAppActions } from '@/hooks/use-app-actions'
import type { Session } from '@supabase/supabase-js'

export function useAuth() {
  const { user, isAuthenticated, reset } = useAppStore()
  const { initializeApp } = useAppActions()
  const initializingRef = useRef(false)
  const initializedUserRef = useRef<string | null>(null)
  const initPromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const supabase = createClientBrowser()

    // Función para manejar cambios de autenticación
    const handleAuthChange = async (event: string, session: Session | null) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Evitar inicializaciones duplicadas - si ya hay una en proceso, esperarla
        if (initPromiseRef.current) {
          console.log('Inicialización ya en progreso, esperando...')
          await initPromiseRef.current
          return
        }
        
        if (initializedUserRef.current === session.user.id) {
          console.log('Usuario ya inicializado:', session.user.id)
          return
        }
        
        console.log('Usuario logueado, inicializando app...')
        initializingRef.current = true
        
        // Crear y guardar la promesa de inicialización
        initPromiseRef.current = initializeApp(session.user.id).then(() => {
          initializedUserRef.current = session.user.id
          console.log('✅ Inicialización exitosa para usuario:', session.user.id)
        }).catch((error) => {
          console.error('❌ Error inicializando app:', error)
        }).finally(() => {
          initializingRef.current = false
          initPromiseRef.current = null
        })
        
        await initPromiseRef.current
      } else if (event === 'SIGNED_OUT') {
        console.log('Usuario deslogueado, limpiando estado...')
        initializingRef.current = false
        initializedUserRef.current = null
        initPromiseRef.current = null
        reset()
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Token refrescado, manteniendo sesión...')
        // El usuario ya está en el store, solo verificamos que siga activo
        const currentUser = useAppStore.getState().user
        if (!currentUser && !initializingRef.current && !initPromiseRef.current) {
          initializingRef.current = true
          
          initPromiseRef.current = initializeApp(session.user.id).then(() => {
            initializedUserRef.current = session.user.id
            console.log('✅ Inicialización por token refresh exitosa para usuario:', session.user.id)
          }).catch((error) => {
            console.error('❌ Error en inicialización por token refresh:', error)
          }).finally(() => {
            initializingRef.current = false
            initPromiseRef.current = null
          })
          
          await initPromiseRef.current
        }
      }
    }

    // Verificar sesión inicial
    const checkInitialSession = async () => {
      if (initializingRef.current || initPromiseRef.current) {
        console.log('Ya inicializando, saltando verificación inicial')
        if (initPromiseRef.current) {
          await initPromiseRef.current
        }
        return
      }
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error obteniendo sesión inicial:', error)
          return
        }

        if (session?.user) {
          // Verificar si ya está inicializado para este usuario
          if (initializedUserRef.current === session.user.id) {
            console.log('Usuario ya inicializado:', session.user.id)
            return
          }
          
          console.log('Sesión inicial encontrada:', session.user.id)
          initializingRef.current = true
          
          initPromiseRef.current = initializeApp(session.user.id).then(() => {
            initializedUserRef.current = session.user.id
            console.log('✅ Inicialización inicial exitosa para usuario:', session.user.id)
          }).catch((error) => {
            console.error('❌ Error en inicialización inicial:', error)
          }).finally(() => {
            initializingRef.current = false
            initPromiseRef.current = null
          })
          
          await initPromiseRef.current
        } else {
          console.log('No hay sesión inicial, usuario no autenticado')
          initializingRef.current = false
          initializedUserRef.current = null
          initPromiseRef.current = null
          reset()
        }
      } catch (error) {
        console.error('Error verificando sesión inicial:', error)
        initializingRef.current = false
        initializedUserRef.current = null
        initPromiseRef.current = null
        reset()
      }
    }

    // Configurar listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)

    // Verificar sesión inicial al cargar
    checkInitialSession()

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [initializeApp, reset]) // Removido 'user' para evitar loop infinito

  return {
    user,
    isAuthenticated,
    loading: useAppStore((state) => state.isLoading)
  }
}