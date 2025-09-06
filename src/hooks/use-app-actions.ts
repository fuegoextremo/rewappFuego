import { useCallback } from 'react'
import { useAppStore, CheckinData, UserProfile } from '@/stores/app-store'
import { createClientBrowser } from '@/lib/supabase/client'

export function useAppActions() {
  const store = useAppStore()
  
  // Cargar datos del usuario
  const loadUserData = useCallback(async (userId: string, forceReload = false) => {
    console.log('🔍 loadUserData called - userId:', userId, 'forceReload:', forceReload)
    
    // Evitar recargar si ya tenemos datos del mismo usuario (excepto si es forzado)
    if (!forceReload && store.user?.id === userId && store.user.total_checkins !== undefined) {
      console.log('Datos del usuario ya cargados, saltando...')
      return
    }
    
    console.log('✅ Procediendo a cargar datos del usuario...')
    try {
      store.setLoading(true)
      const supabase = createClientBrowser()
      
      console.log('📡 Creando cliente Supabase...')
      
      // Cargar perfil del usuario
    console.log('👤 Cargando perfil del usuario...')
    console.log('🔍 Ejecutando query: user_profiles...')
    const { data: userData, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    console.log('📊 Query user_profiles completada - data:', !!userData, 'error:', !!error)
    
    if (error) {
      console.error('❌ Error cargando datos del usuario:', error)
      return
    }
    
    const profile = userData
    console.log('👤 Perfil obtenido:', profile ? 'Sí' : 'No')

      if (profile) {
        console.log('📊 Obteniendo estadísticas adicionales...')
        // Obtener estadísticas adicionales con manejo de errores individual
        const [
          checkinsResult,
          spinsResult,
          streakResult
        ] = await Promise.allSettled([
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
        
        // Procesar resultados con fallbacks
        const totalCheckins = checkinsResult.status === 'fulfilled' ? checkinsResult.value.count : 0
        const userSpins = spinsResult.status === 'fulfilled' ? spinsResult.value.data : { available_spins: 0 }
        const userStreak = streakResult.status === 'fulfilled' ? streakResult.value.data : null
        
        if (streakResult.status === 'rejected') {
          console.warn('⚠️ Error cargando streak (usando fallback):', streakResult.reason?.message || 'Unknown error')
        }
        
        console.log('📊 Estadísticas obtenidas - checkins:', totalCheckins, 'spins:', userSpins, 'streak:', userStreak)
        
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
        
        console.log('👤 Datos del usuario procesados, guardando en store...')
        store.setUser(userWithStats)
        console.log('✅ Usuario guardado en store exitosamente')
      } else {
        console.log('❌ No se encontró el perfil del usuario')
      }
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error)
    } finally {
      console.log('🏁 Finalizando loadUserData...')
      store.setLoading(false)
    }
  }, [store])
  
  // Cargar checkins recientes
  const loadRecentCheckins = useCallback(async (userId: string, limit = 10) => {
    console.log('🔄 Iniciando loadRecentCheckins...')
    try {
      const supabase = createClientBrowser()
    console.log('📡 Obteniendo checkins recientes...')
    console.log('🔍 Ejecutando query: check_ins...')
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('📊 Query check_ins completada - data:', !!data, 'count:', data?.length || 0, 'error:', !!error)
    
    const checkins = data
    if (checkins && checkins.length > 0) {
        const checkinData: CheckinData = {
          id: checkins[0].id,
          user_id: checkins[0].user_id,
          branch_id: checkins[0].branch_id,
          created_at: checkins[0].created_at,
          streak_count: 0 // Se actualizará desde el store de streaks
        }
        store.addCheckin(checkinData)
        console.log('✅ Checkins procesados y guardados en store')
      } else {
        console.log('ℹ️ No se encontraron checkins recientes')
      }
    } catch (error) {
      console.error('❌ Error cargando checkins:', error)
    } finally {
      console.log('🏁 Finalizando loadRecentCheckins...')
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
  const loadSystemSettings = useCallback(async (forceReload = false) => {
    console.log('🔍 loadSystemSettings called - forceReload:', forceReload)
    
    // Evitar recargar si ya tenemos configuraciones (excepto si es forzado)
    if (!forceReload && Object.keys(store.settings).length > 0) {
      console.log('Configuraciones ya cargadas, saltando...')
      return
    }
    
    console.log('✅ Procediendo a cargar configuraciones...')
    try {
      const supabase = createClientBrowser()
      console.log('🔍 Ejecutando query: system_settings...')
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('is_active', true)
      
      console.log('📊 Query system_settings completada - data:', !!data, 'count:', data?.length || 0)
      
      if (data) {
        const settings = data.reduce((acc: Record<string, string>, { key, value }) => {
          acc[key] = value
          return acc
        }, {})
        
        store.setSettings(settings)
        console.log('✅ loadSystemSettings completed - settings updated')
      } else {
        console.log('⚠️ loadSystemSettings completed - no data received')
      }
    } catch (error) {
      console.error('❌ Error cargando configuraciones:', error)
    }
  }, [store])
  
  // Inicializar la aplicación
  const initializeApp = useCallback(async (userId: string, forceReload = false) => {
    console.log('🚀 initializeApp called - userId:', userId, 'forceReload:', forceReload)
    
    try {
      await Promise.all([
        loadUserData(userId, forceReload),
        loadRecentCheckins(userId),
        loadSystemSettings(forceReload)
      ])
      
      console.log('✅ initializeApp completed successfully')
    } catch (error) {
      console.error('❌ initializeApp failed:', error)
      // No lanzar el error - permitir que la app continúe
    }
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
