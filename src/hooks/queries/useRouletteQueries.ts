'use client'

import { useQuery } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'

// 🎰 Tipo para premios de ruleta
export type RoulettePrize = {
  id: string
  name: string
  description: string | null
  weight: number | null
  image_url: string | null
  validity_days: number | null
  inventory_count: number | null
  is_active: boolean | null
}

// 🎯 Hook para giros disponibles
export function useUserSpins(userId: string) {
  return useQuery({
    queryKey: ['user', 'spins', userId],
    queryFn: async () => {
      const supabase = createClientBrowser()
      
      const { data: spinsRow } = await supabase
        .from('user_spins')
        .select('available_spins')
        .eq('user_id', userId)
        .maybeSingle()

      return {
        availableSpins: spinsRow?.available_spins ?? 0
      }
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // ✨ 1 minuto - datos dinámicos que pueden cambiar con Realtime
    gcTime: 5 * 60 * 1000,    // ✨ 5 minutos en cache
    refetchOnWindowFocus: false, // ✨ Confiar en Realtime para updates
  })
}

// 🏆 Hook para premios de ruleta disponibles
export function useRoulettePrizes() {
  return useQuery({
    queryKey: ['roulette', 'prizes'],
    queryFn: async (): Promise<RoulettePrize[]> => {
      const supabase = createClientBrowser()
      
      const { data: prizes, error } = await supabase
        .from('prizes')
        .select('*')
        .eq('type', 'roulette')
        .eq('is_active', true)
        .gt('inventory_count', 0)
        .order('weight', { ascending: false })

      if (error) throw error
      return prizes || []
    },
    staleTime: 5 * 60 * 1000,  // ✨ 5 minutos - premios cambian ocasionalmente
    gcTime: 15 * 60 * 1000,    // ✨ 15 minutos en cache
    refetchOnWindowFocus: false, // ✨ Cache semi-agresivo para premios
  })
}

// 🎨 Helper function para rarity display (reutilizada de classic)
export function getRarityFromWeight(weight: number): { label: string; color: string; emoji: string } {
  if (weight >= 16) return { label: 'Muy Común', color: 'bg-green-50 text-green-700 border-green-200', emoji: '🟢' }
  if (weight >= 10) return { label: 'Común', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', emoji: '🟡' }
  if (weight >= 5) return { label: 'Raro', color: 'bg-orange-50 text-orange-700 border-orange-200', emoji: '🟠' }
  if (weight >= 2) return { label: 'Épico', color: 'bg-red-50 text-red-700 border-red-200', emoji: '🔴' }
  return { label: 'Legendario', color: 'bg-purple-50 text-purple-700 border-purple-200', emoji: '🟣' }
}
