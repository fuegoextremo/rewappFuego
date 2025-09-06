import React, { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase/client'
import Image from 'next/image'

interface AutonomousStreakSectionProps {
  userId: string
}

interface Prize {
  id: string
  name: string
  description: string | null
  image_url: string | null
  streak_threshold: number | null
  is_active: boolean | null
}

interface StreakData {
  currentStreak: number
  prizes: Prize[]
  loading: boolean
  error: string | null
}

// Función para cargar datos de racha (usando la estructura del componente original)
async function loadStreakData(userId: string): Promise<{ streak: number; prizes: Prize[] }> {
  const supabase = createClientBrowser()
  
  // VERIFICAR SESIÓN ANTES DE HACER QUERIES (esto es lo que falta vs el original)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.warn('No hay sesión activa para cargar streaks')
    throw new Error('No hay sesión activa')
  }
  
  try {
    // Cargar premios de tipo streak
    const { data: streakPrizes, error: prizesError } = await supabase
      .from('prizes')
      .select('id, name, description, streak_threshold, image_url, validity_days, is_active')
      .eq('type', 'streak')
      .eq('is_active', true)
      .order('streak_threshold', { ascending: true })
    
    if (prizesError) {
      console.error('Error loading prizes:', prizesError)
      return { streak: 0, prizes: [] }
    }
    
    // Intentar cargar racha del usuario (puede fallar, usar fallback)
    const { data: userStreak, error: streakError } = await supabase
      .from('streaks')
      .select('current_count, expires_at, last_check_in')
      .eq('user_id', userId)
      .single()
    
    // Manejar errores específicos como en StoreStreakSection
    if (streakError && streakError.code !== 'PGRST116') { // PGRST116 = no rows
      console.warn('Error en streaks (pero continuamos):', streakError.message, 'Code:', streakError.code)
    }
    
    // Si NO hay datos de streak (normal para usuarios nuevos), usar fallback
    if (!userStreak) {
      return { 
        streak: 0, 
        prizes: streakPrizes || [] 
      }
    }
    
    // Verificar si la racha ha expirado
    const isExpired = userStreak?.expires_at ? 
      new Date(userStreak.expires_at) < new Date() : false
    
    const finalStreak = isExpired ? 0 : (userStreak?.current_count || 0)
    
    return { 
      streak: finalStreak, 
      prizes: streakPrizes || [] 
    }
  } catch (error) {
    console.error('Error loading streak data:', error)
    return { streak: 0, prizes: [] }
  }
}

// Lógica original para calcular la etapa de racha
function calculateStreakStage(currentStreak: number, prizes: Prize[]) {
  if (!prizes.length) {
    return {
      currentImage: '/mascots/fuego-basic.png',
      progress: 0,
      nextPrize: null,
      currentPrize: null
    }
  }
  
  // Encontrar el siguiente premio
  const nextPrize = prizes.find(prize => (prize.streak_threshold || 0) > currentStreak)
  
  // Encontrar el premio actual (último conseguido)
  const currentPrize = prizes
    .filter(prize => (prize.streak_threshold || 0) <= currentStreak)
    .sort((a, b) => (b.streak_threshold || 0) - (a.streak_threshold || 0))[0]
  
  // Calcular progreso
  let progress = 0
  if (nextPrize) {
    const previousStreak = currentPrize ? (currentPrize.streak_threshold || 0) : 0
    const totalRange = (nextPrize.streak_threshold || 0) - previousStreak
    const currentRange = currentStreak - previousStreak
    progress = totalRange > 0 ? (currentRange / totalRange) * 100 : 0
  } else if (currentPrize) {
    progress = 100 // Ya alcanzó el último premio
  }
  
  // Determinar imagen
  let currentImage = '/mascots/fuego-basic.png'
  if (currentStreak >= 10) {
    currentImage = '/mascots/fuego-fire.png'
  } else if (currentStreak >= 5) {
    currentImage = '/mascots/fuego-happy.png'
  } else if (currentStreak >= 1) {
    currentImage = '/mascots/fuego-smile.png'
  }
  
  return {
    currentImage,
    progress: Math.min(progress, 100),
    nextPrize,
    currentPrize
  }
}

export function AutonomousStreakSection({ userId }: AutonomousStreakSectionProps) {
  const [state, setState] = useState<StreakData>({
    currentStreak: 0,
    prizes: [],
    loading: true,
    error: null
  })
  
  // Función para recargar datos (para el botón de reintentar)
  const handleRetry = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { streak, prizes } = await loadStreakData(userId)
      setState({
        currentStreak: streak,
        prizes,
        loading: false,
        error: null
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error loading data'
      }))
    }
  }
  
  // Cargar datos una sola vez al montar (como el componente original)
  useEffect(() => {
    let isMounted = true
    
    async function loadData() {
      try {
        const { streak, prizes } = await loadStreakData(userId)
        
        if (isMounted) {
          setState({
            currentStreak: streak,
            prizes,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Error loading streak data'
          }))
        }
      }
    }
    
    loadData()
    
    return () => { isMounted = false }
  }, [userId]) // Incluir userId como dependencia
  
  // Escuchar refresh global (separado y simple)
  useEffect(() => {
    const handleRefresh = async () => {
      setState(prev => ({ ...prev, loading: true }))
      try {
        const { streak, prizes } = await loadStreakData(userId)
        setState({
          currentStreak: streak,
          prizes,
          loading: false,
          error: null
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error loading data'
        }))
      }
    }
    
    window.addEventListener('app-refresh', handleRefresh)
    return () => window.removeEventListener('app-refresh', handleRefresh)
  }, [userId]) // Solo depende de userId

  // Validación del userId después de los hooks
  if (!userId) {
    return (
      <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 text-center">
        <p className="text-red-600">Error: Usuario no identificado</p>
      </div>
    )
  }
  
  // Estados de loading y error
  if (state.loading) {
    return (
      <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 text-center">
        <div className="animate-pulse">
          <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }
  
  if (state.error) {
    return (
      <div className="bg-gray-100 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">🔥</div>
        <h3 className="text-lg font-semibold mb-2">Racha del día</h3>
        <p className="text-gray-600 text-sm">No se pudieron cargar los datos</p>
        <button 
          onClick={loadData}
          className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
        >
          Reintentar
        </button>
      </div>
    )
  }
  
  // Calcular datos de la racha usando la lógica original
  const { currentImage, progress, nextPrize, currentPrize } = calculateStreakStage(state.currentStreak, state.prizes)
  
  return (
    <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 text-center">
      {/* Imagen de mascota */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        <Image
          src={currentImage}
          alt={`Fuego con racha ${state.currentStreak}`}
          fill
          className="object-contain"
        />
      </div>
      
      {/* Información de racha */}
      <h3 className="text-lg font-semibold mb-2">
        Racha actual: {state.currentStreak} días
      </h3>
      
      {/* Progreso hacia siguiente premio */}
      {nextPrize && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progreso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {(nextPrize.streak_threshold || 0) - state.currentStreak} días para: {nextPrize.name}
          </p>
        </div>
      )}
      
      {/* Premio actual o mensaje de motivación */}
      {currentPrize ? (
        <div className="bg-white/50 rounded-lg p-3 mt-4">
          <p className="text-sm font-medium text-green-700">
            🎉 Premio desbloqueado: {currentPrize.name}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          ¡Mantén tu racha para desbloquear premios!
        </p>
      )}
    </div>
  )
}
