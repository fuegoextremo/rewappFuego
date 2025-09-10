import { useEffect } from 'react'
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
            
          case 'TOKEN_REFRESHED':
            if (session?.user && !user) {
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
  }, [dispatch, user?.id]) // Solo depende del ID del usuario

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
