import { useCallback } from 'react'
import { useAppStore, CheckinData, UserProfile } from '@/stores/app-store'
import { createClientBrowser } from '@/lib/supabase/client'

export function useAppActions() {
  const store = useAppStore()
  
  // Cargar datos del usuario
  const loadUserData = useCallback(async (userId: string) => {
    try {
      store.setLoading(true)
      const supabase = createClientBrowser()
      
      // Cargar perfil del usuario
      const { data: profile } = await supabase
        .from('user_profiles')
        .select(`
          *,
          branches:branch_id(name)
        `)
        .eq('id', userId)
        .single()
      
      if (profile) {
        // Obtener estadísticas adicionales
        const [
          { count: totalCheckins },
          { data: userSpins },
          { data: userStreak }
        ] = await Promise.all([
          supabase
            .from('check_ins')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('user_spins')
            .select('available_spins')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('streaks')
            .select('current_count')
            .eq('user_id', userId)
            .single()
        ])
        
        const userWithStats: UserProfile = {
          id: profile.id,
          email: profile.id, // El email viene del auth, usamos id por ahora
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          role: profile.role,
          is_active: profile.is_active,
          branch_id: profile.branch_id,
          created_at: profile.created_at,
          total_checkins: totalCheckins || 0,
          available_spins: userSpins?.available_spins || 0,
          current_streak: userStreak?.current_count || 0
        }
        
        store.setUser(userWithStats)
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error)
    } finally {
      store.setLoading(false)
    }
  }, [store])
  
  // Cargar checkins recientes
  const loadRecentCheckins = useCallback(async (userId: string, limit = 10) => {
    try {
      const supabase = createClientBrowser()
      const { data: checkins } = await supabase
        .from('check_ins')
        .select(`
          id,
          user_id,
          branch_id,
          created_at,
          branches:branch_id(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (checkins && checkins.length > 0) {
        const checkinData: CheckinData = {
          id: checkins[0].id,
          user_id: checkins[0].user_id,
          branch_id: checkins[0].branch_id,
          created_at: checkins[0].created_at,
          streak_count: 0 // Se actualizará desde el store de streaks
        }
        store.addCheckin(checkinData)
      }
    } catch (error) {
      console.error('Error cargando checkins:', error)
    }
  }, [store])
  
  // Realizar checkin
  const performCheckin = useCallback(async (branchId: string, qrToken?: string) => {
    try {
      store.setLoading(true)
      const supabase = createClientBrowser()
      
      const { data, error } = await supabase.functions.invoke('process-checkin', {
        body: {
          branch_id: branchId,
          qr_token: qrToken
        }
      })
      
      if (error) throw error
      
      if (data?.checkin) {
        // Actualizar estado inmediatamente
        store.addCheckin(data.checkin)
        
        // Recargar datos del usuario para tener stats actualizados
        const user = store.user
        if (user) {
          await loadUserData(user.id)
        }
        
        return { success: true, data }
      }
      
      return { success: false, error: 'No se pudo completar el checkin' }
    } catch (error) {
      console.error('Error en checkin:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }
    } finally {
      store.setLoading(false)
    }
  }, [store, loadUserData])
  
  // Cargar configuraciones del sistema
  const loadSystemSettings = useCallback(async () => {
    try {
      const supabase = createClientBrowser()
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('is_active', true)
      
      if (data) {
        const settings = data.reduce((acc: Record<string, string>, { key, value }) => {
          acc[key] = value
          return acc
        }, {})
        
        store.setSettings(settings)
      }
    } catch (error) {
      console.error('Error cargando configuraciones:', error)
    }
  }, [store])
  
  // Inicializar la aplicación
  const initializeApp = useCallback(async (userId: string) => {
    await Promise.all([
      loadUserData(userId),
      loadRecentCheckins(userId),
      loadSystemSettings()
    ])
  }, [loadUserData, loadRecentCheckins, loadSystemSettings])
  
  return {
    loadUserData,
    loadRecentCheckins,
    performCheckin,
    loadSystemSettings,
    initializeApp,
    // Acceso directo a las acciones del store
    setCurrentView: store.setCurrentView,
    setLoading: store.setLoading,
    reset: store.reset
  }
}
