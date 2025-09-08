import { useQuery } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'

// 🎯 Hook optimizado para datos de racha con cache persistente
export function useUserStreak(userId: string) {
  return useQuery({
    queryKey: ['user', 'streak', userId],
    queryFn: async () => {
      const supabase = createClientBrowser()
      
      const { data: userStreak } = await supabase
        .from('streaks')
        .select('current_count, expires_at, last_check_in')
        .eq('user_id', userId)
        .single()

      return {
        currentCount: userStreak?.current_count || 0,
        expiresAt: userStreak?.expires_at,
        lastCheckIn: userStreak?.last_check_in,
        rawData: userStreak
      }
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // ✨ 1 minuto - datos dinámicos que pueden cambiar con Realtime
    gcTime: 5 * 60 * 1000,    // ✨ 5 minutos en cache (el Realtime Provider los invalida)
    refetchOnWindowFocus: false, // ✨ Confiar en Realtime para updates
  })
}

// 🎯 Hook para premios de racha (más estáticos)
export function useStreakPrizes() {
  return useQuery({
    queryKey: ['streak', 'prizes'],
    queryFn: async () => {
      const supabase = createClientBrowser()
      
      const { data: streakPrizes, error } = await supabase
        .from('prizes')
        .select('id, name, description, streak_threshold, image_url, validity_days')
        .eq('type', 'streak')
        .eq('is_active', true)
        .order('streak_threshold', { ascending: true })

      if (error) throw error
      return streakPrizes || []
    },
    staleTime: 15 * 60 * 1000, // ✨ 15 minutos - premios cambian raramente
    gcTime: 60 * 60 * 1000,    // ✨ 1 hora en cache - datos semi-estáticos
    refetchOnWindowFocus: false, // ✨ Cache agresivo para premios
  })
}

// 🎯 NUEVO: Hook para el stage calculado (con cache)
export function useStreakStage(userId: string, settings: any) {
  const { data: streakData, isLoading: streakLoading } = useUserStreak(userId)
  const { data: streakPrizes, isLoading: prizesLoading } = useStreakPrizes()
  
  return useQuery({
    queryKey: ['streak', 'stage', userId, streakData?.currentCount, settings?.streak_break_days],
    queryFn: async () => {
      // ✨ No devolver null, calcular con datos disponibles
      const currentCount = streakData?.currentCount || 0
      const prizes = streakPrizes || []
      const userSettings = settings || {}
      
      // ✅ SAFETY CHECK: Si no hay prizes cargados, usar array vacío como fallback
      if (!streakPrizes) {
        console.warn('⚠️ streakPrizes no está disponible, usando fallback')
        return calculateStreakStage(currentCount, [], userSettings)
      }
      
      const { rawData: userStreak } = streakData || { rawData: null }
      
      // Misma lógica que antes, pero con fallbacks
      if (!userStreak) {
        return calculateStreakStage(0, prizes, userSettings)
      }

      // Verificar expiración
      const isExpired = userStreak?.expires_at ? 
        new Date(userStreak.expires_at) < new Date() : false

      if (isExpired) {
        return {
          image: userSettings?.streak_initial_image || "🔥",
          stage: "¡Nuevo periodo de rachas!",
          progress: 0,
          nextGoal: prizes?.[0]?.streak_threshold || 5,
          nextReward: prizes?.[0]?.name || "Premio sorpresa",
          canRestart: true
        }
      }

      // Verificar inactividad
      const breakDaysLimit = parseInt(userSettings?.streak_break_days || '12')
      const daysSinceLastCheckin = userStreak?.last_check_in ?
        Math.floor((new Date().getTime() - new Date(userStreak.last_check_in).getTime()) / (1000 * 60 * 60 * 24)) : 0
      const streakBroken = daysSinceLastCheckin > breakDaysLimit

      if (streakBroken) {
        return {
          image: "😴",
          stage: "Racha perdida - ¡Reinicia!",
          progress: 0,
          nextGoal: prizes?.[0]?.streak_threshold || 5,
          nextReward: prizes?.[0]?.name || "Premio sorpresa",
          canRestart: true
        }
      }

      // Racha activa
      return calculateStreakStage(currentCount, prizes, userSettings)
    },
    enabled: !!userId && !!settings, // 🧪 TEMPORARY: Revertir para test
    staleTime: 30 * 1000, // ✨ 30 segundos - stage calculado puede cambiar rápido
    gcTime: 2 * 60 * 1000, // ✨ 2 minutos en cache
    refetchOnWindowFocus: false, // ✨ Confiar en invalidaciones del Realtime
  })
}

// Helper function movida aquí
function calculateStreakStage(currentCount: number, streakPrizes: any[], settings: any) {
  const FALLBACK_IMAGES = {
    streak_initial: "🔥", 
    streak_progress: "🚀", 
    streak_complete: "🏆",
    streak_expired: "😴"
  }

  const validPrizes = streakPrizes.filter(p => p.streak_threshold && p.streak_threshold > 0)
  
  if (currentCount === 0) {
    return {
      image: settings?.streak_initial_image || FALLBACK_IMAGES.streak_initial,
      stage: "¡Empieza tu primera visita!",
      progress: 0,
      nextGoal: validPrizes[0]?.streak_threshold || 5,
      nextReward: validPrizes[0]?.name || "Premio sorpresa"
    }
  }

  const currentThreshold = validPrizes.findLast((p: any) => p.streak_threshold <= currentCount)
  const nextThreshold = validPrizes.find((p: any) => p.streak_threshold > currentCount)

  if (nextThreshold) {
    const baseProgress = currentThreshold?.streak_threshold || 0
    const progressRange = nextThreshold.streak_threshold - baseProgress
    const currentProgress = currentCount - baseProgress
    const progressPercentage = (currentProgress / progressRange) * 100

    return {
      image: currentThreshold?.image_url || 
             settings?.streak_progress_default || 
             FALLBACK_IMAGES.streak_progress,
      stage: `Racha activa: ${currentCount} visitas`,
      progress: Math.min(progressPercentage, 100),
      nextGoal: nextThreshold.streak_threshold,
      nextReward: nextThreshold.name
    }
  }

  return {
    image: settings?.streak_complete_image || FALLBACK_IMAGES.streak_complete,
    stage: "¡Racha máxima completada!",
    progress: 100,
    canRestart: true,
    isCompleted: true
  }
}
