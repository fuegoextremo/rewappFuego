import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/client'
import { useAppDispatch, useAuth } from '@/store/hooks'
import { 
  loadUserProfile, 
  setUser, 
  setLoading, 
  logout as logoutAction,
  // 🔥 NUEVOS: Cargar datos que estaban en React Query
  loadRecentActivity,
  loadStreakPrizes,
  loadUserStreakData
} from '@/store/slices/authSlice'
import { loadSettings } from '@/store/slices/settingsSlice'

// 🔗 HOOK PRINCIPAL DE AUTENTICACIÓN
export function useAuthManager() {
  const dispatch = useAppDispatch()
  const { user, isLoading, isAuthenticated, error } = useAuth()
  const router = useRouter()
  
  // 🎯 OPTIMIZACIÓN: Ref estable para evitar loop con user como dependencia
  const userRef = useRef(user)
  userRef.current = user

  // 🎧 CONFIGURAR LISTENERS DE SUPABASE
  useEffect(() => {
    const supabase = createClientBrowser()

    // Listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event, session?.user?.id)
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              // 🎯 OPTIMIZACIÓN: Solo cargar datos si es un login REAL, no una reconexión
              const isReconnection = userRef.current?.id === session.user.id
              
              if (isReconnection) {
                console.log('🔄 Auth: SIGNED_IN detectado como reconexión - saltando cargas innecesarias')
                return // Skip cargas duplicadas durante reconexión
              }
              
              console.log('🔑 Auth: Nuevo login detectado - cargando datos del usuario')
              // Cargar perfil del usuario
              dispatch(loadUserProfile(session.user.id))
              // Cargar configuraciones
              dispatch(loadSettings())
              
              // 🔥 NUEVOS: Cargar datos que estaban en React Query
              dispatch(loadRecentActivity(session.user.id))
              dispatch(loadStreakPrizes()) // Solo una vez, no depende del usuario
              dispatch(loadUserStreakData(session.user.id))
            }
            break

          case 'INITIAL_SESSION':
            if (session?.user) {
              // 🎯 OPTIMIZACIÓN: INITIAL_SESSION es igual que reconexión
              const isAlreadyLoaded = userRef.current?.id === session.user.id
              
              if (isAlreadyLoaded) {
                console.log('🔄 Auth: INITIAL_SESSION detectado con usuario ya cargado - saltando')
                return // Skip para prevenir loop infinito
              }
              
              console.log('🔑 Auth: INITIAL_SESSION con nuevo usuario - cargando datos')
              // Cargar perfil del usuario
              dispatch(loadUserProfile(session.user.id))
              // Cargar configuraciones
              dispatch(loadSettings())
              
              // 🔥 NUEVOS: Cargar datos que estaban en React Query
              dispatch(loadRecentActivity(session.user.id))
              dispatch(loadStreakPrizes())
              dispatch(loadUserStreakData(session.user.id))
            }
            break
            
          case 'TOKEN_REFRESHED':
            if (session?.user && !userRef.current) {
              // Solo cargar si no hay usuario en store
              dispatch(loadUserProfile(session.user.id))
              dispatch(loadSettings())
              
              // 🔥 NUEVOS: También cargar estos datos
              dispatch(loadRecentActivity(session.user.id))
              dispatch(loadStreakPrizes())
              dispatch(loadUserStreakData(session.user.id))
            }
            break
            
          case 'SIGNED_OUT':
            dispatch(setUser(null))
            console.log('👋 Usuario deslogueado')
            break
        }
      }
    )

    // Verificar sesión inicial
    const checkInitialSession = async () => {
      try {
        dispatch(setLoading(true))
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error obteniendo sesión inicial:', error)
          return
        }

        if (session?.user) {
          console.log('📱 Sesión inicial encontrada:', session.user.id)
          
          // 🎯 OPTIMIZACIÓN: Solo cargar si no hay usuario en store
          const isAlreadyLoaded = userRef.current?.id === session.user.id
          
          if (isAlreadyLoaded) {
            console.log('🔄 Auth: checkInitialSession - usuario ya cargado, saltando')
            return // Prevenir doble carga con INITIAL_SESSION event
          }
          
          dispatch(loadUserProfile(session.user.id))
          dispatch(loadSettings())
        } else {
          console.log('❌ No hay sesión inicial')
          dispatch(setUser(null))
        }
      } catch (error) {
        console.error('Error en verificación inicial:', error)
        dispatch(setUser(null))
      } finally {
        dispatch(setLoading(false))
      }
    }

    checkInitialSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch]) // 🎯 OPTIMIZACIÓN: Solo dispatch - user como dependencia causa loop infinito

  // 🚪 FUNCIÓN DE LOGOUT
  const logout = async () => {
    try {
      await dispatch(logoutAction()).unwrap()
      router.push('/login')
    } catch (error) {
      console.error('Error en logout:', error)
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout
  }
}
