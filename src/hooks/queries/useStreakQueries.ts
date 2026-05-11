import { useQuery } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/queryClient'

// ❌ DEPRECATED: Interfaces eliminadas - tipos movidos a StreakSection.tsx

// 🎯 Hook optimizado para datos de racha con cache reactivo
export function useUserStreak(userId: string) {
  return useQuery({
    queryKey: queryKeys.user.streak(userId),
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
    staleTime: 30 * 1000,         // ✨ 30 segundos - más reactivo para datos dinámicos
    gcTime: 2 * 60 * 1000,        // ✨ 2 minutos en cache - el Realtime los invalida rápido
    refetchOnWindowFocus: false,   // ✨ Confiar en Realtime para updates
    refetchOnMount: 'always',      // ✨ Siempre refetch al montar para datos frescos
  })
}

// 🎯 Hook para premios de racha (más estáticos)
export function useStreakPrizes() {
  return useQuery({
    queryKey: queryKeys.streaks.prizes,
    queryFn: async () => {
      const supabase = createClientBrowser()
      
      const { data: streakPrizes, error } = await supabase
        .from('prizes')
        .select('id, name, description, streak_threshold, image_url, validity_days')
        .eq('type', 'streak')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('streak_threshold', { ascending: true })

      if (error) throw error
      return streakPrizes || []
    },
    staleTime: 15 * 60 * 1000, // ✨ 15 minutos - premios cambian raramente
    gcTime: 60 * 60 * 1000,    // ✨ 1 hora en cache - datos semi-estáticos
    refetchOnWindowFocus: false, // ✨ Cache agresivo para premios
    retry: 3, // 🔄 Retry básico - 3 intentos automáticos
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // 🔄 1s, 2s, 4s max 5s
  })
}

// ❌ DEPRECATED: useStreakStage eliminado - lógica migrada a StreakSection.tsx
// ❌ DEPRECATED: calculateStreakStage helper eliminado - duplicado innecesario
