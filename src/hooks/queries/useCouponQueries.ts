import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'
import { getUserCoupons, getAvailableCoupons, getUsedCoupons, useCoupon } from '@/lib/api/coupons'
import { queryKeys } from '@/lib/queryClient'

// �️ Tipo para cupones (compatible con classic)
export type CouponRow = {
  id: string
  unique_code: string
  expires_at: string | null
  is_redeemed: boolean | null
  redeemed_at: string | null
  source: string | null
  created_at: string | null
  prizes: {
    name: string
    image_url: string | null
  } | null
}

// �🎯 HOOKS DE REACT QUERY PARA CUPONES (MODERNIZADOS)

export function useUserCoupons(userId: string) {
  return useQuery({
    queryKey: queryKeys.user.coupons(userId),
    queryFn: async (): Promise<CouponRow[]> => {
      const supabase = createClientBrowser()
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
          prizes ( name, image_url )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as CouponRow[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // ✨ 2 minutos - pueden cambiar con la ruleta
    gcTime: 10 * 60 * 1000,   // ✨ 10 minutos en cache
    refetchOnWindowFocus: false, // ✨ Confiar en Realtime para updates
  })
}

export function useAvailableCoupons(userId: string) {
  return useQuery({
    queryKey: queryKeys.coupons.available(userId),
    queryFn: async (): Promise<CouponRow[]> => {
      const supabase = createClientBrowser()
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
          prizes ( name, image_url )
        `)
        .eq('user_id', userId)
        .eq('is_redeemed', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as CouponRow[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // ✨ 2 minutos - balanceado
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useUsedCoupons(userId: string) {
  return useQuery({
    queryKey: queryKeys.coupons.used(userId),
    queryFn: async (): Promise<CouponRow[]> => {
      const supabase = createClientBrowser()
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
          prizes ( name, image_url )
        `)
        .eq('user_id', userId)
        .eq('is_redeemed', true)
        .order('redeemed_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as CouponRow[]
    },
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // ✨ 15 minutos - datos históricos, menos cambios
    gcTime: 30 * 60 * 1000,    // ✨ 30 minutos en cache
    refetchOnWindowFocus: false,
  })
}

// 🔄 MUTACIÓN PARA USAR CUPÓN (MODERNIZADA)
export function useUseCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ couponId, userId }: { couponId: string; userId: string }) => {
      const supabase = createClientBrowser()
      
      const { data, error } = await supabase
        .from('coupons')
        .update({ 
          is_redeemed: true, 
          redeemed_at: new Date().toISOString()
        })
        .eq('id', couponId)
        .eq('user_id', userId)
        .select()

      if (error) throw error
      return data?.[0]
    },
    onSuccess: (data, variables) => {
      // 🔄 Actualizar cache con queryKeys centralizados
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.user.coupons(variables.userId)
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.coupons.available(variables.userId)
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.coupons.used(variables.userId)
      })
      
      console.log('✅ Cupón usado exitosamente')
    },
    onError: (error) => {
      console.error('❌ Error usando cupón:', error)
    }
  })
}

// 🔄 FUNCIÓN HELPER PARA REFRESCAR CUPONES (MODERNIZADA)
export function useRefreshCoupons() {
  const queryClient = useQueryClient()

  return (userId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.user.coupons(userId)
    })
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.coupons.available(userId)
    })
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.coupons.used(userId)
    })
  }
}
