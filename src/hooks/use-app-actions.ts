import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loadUserProfile, performCheckin } from '@/store/slices/authSlice'
import { setSettings } from '@/store/slices/settingsSlice'
import { createClientBrowser } from '@/lib/supabase/client'

/**
 * 🎯 HOOK PRINCIPAL PARA ACCIONES DE LA APP (VERSION REDUX)
 * 
 * Basado en database.ts - la fuente de verdad actual de la BD
 * Reemplaza la funcionalidad anterior de Zustand con Redux Toolkit
 */
export function useAppActions() {
  const dispatch = useAppDispatch()
  const { user, isLoading } = useAppSelector(state => state.auth)
  const settings = useAppSelector(state => state.settings)
  
  // 👤 CARGAR DATOS DEL USUARIO
  const loadUserData = useCallback(async (userId: string, forceReload = false) => {
    console.log('🔍 loadUserData called - userId:', userId, 'forceReload:', forceReload)
    
    // 🎯 SINCRONIZACIÓN HÍBRIDA: Verificar que TODOS los datos críticos estén presentes
    const hasCriticalData = user?.id === userId && 
                           user.total_checkins !== undefined && 
                           user.current_streak !== undefined &&
                           user.available_spins !== undefined
    
    if (!forceReload && hasCriticalData) {
      console.log('✅ Cache hit: datos completos en Redux, saltando recarga...', {
        total_checkins: user.total_checkins,
        current_streak: user.current_streak,
        available_spins: user.available_spins
      })
      return
    }
    
    if (!forceReload && user?.id === userId) {
      console.log('🔄 Datos incompletos detectados en Redux, forzando sincronización...', {
        has_total_checkins: user.total_checkins !== undefined,
        has_current_streak: user.current_streak !== undefined,
        has_available_spins: user.available_spins !== undefined
      })
    }
    
    console.log('📡 Cargando datos del usuario con Redux...')
    try {
      await dispatch(loadUserProfile(userId)).unwrap()
      console.log('✅ Datos del usuario cargados exitosamente')
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error)
      throw error
    }
  }, [dispatch, user])

  // 🔥 REALIZAR CHECKIN
  const performCheckinAction = useCallback(async () => {
    console.log('🔥 performCheckin called')
    
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      const result = await dispatch(performCheckin()).unwrap()
      console.log('✅ Checkin realizado exitosamente:', result)
      return result
    } catch (error) {
      console.error('❌ Error en checkin:', error)
      throw error
    }
  }, [dispatch, user])

  // ⚙️ CARGAR CONFIGURACIONES DEL SISTEMA
  const loadSettings = useCallback(async (forceReload = false) => {
    console.log('⚙️ loadSettings called - forceReload:', forceReload)
    
    if (!forceReload && Object.keys(settings).length > 0) {
      console.log('✅ Configuraciones ya cargadas, saltando...')
      return
    }

    try {
      const supabase = createClientBrowser()
      
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('is_active', true)
      
      if (data) {
        const settingsObject = data.reduce((acc: Record<string, string>, { key, value }) => {
          acc[key] = value
          return acc
        }, {})
        
        dispatch(setSettings(settingsObject))
        console.log('✅ Configuraciones cargadas exitosamente')
      }
    } catch (error) {
      console.error('❌ Error cargando configuraciones:', error)
      throw error
    }
  }, [dispatch, settings])

  return {
    // 📊 Estado
    isLoading,
    user,
    settings,
    
    // 🔧 Acciones principales
    loadUserData,
    performCheckin: performCheckinAction,
    loadSettings,
    
    // 🔄 Funciones de compatibilidad (para componentes legacy)
    setCurrentView: () => console.log('⚠️ setCurrentView: usar dispatch(setCurrentView()) directamente'),
  }
}
