import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserCoupons, getAvailableCoupons, getUsedCoupons, useCoupon } from '@/lib/api/coupons'
import { queryKeys } from '@/lib/queryClient'

// 🎯 HOOKS DE REACT QUERY PARA CUPONES

export function useUserCoupons(userId: string) {
  return useQuery({
    queryKey: queryKeys.user.coupons(userId),
    queryFn: () => getUserCoupons(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos (muy dinámico)
  })
}

export function useAvailableCoupons(userId: string) {
  return useQuery({
    queryKey: queryKeys.coupons.available(userId),
    queryFn: () => getAvailableCoupons(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos
  })
}

export function useUsedCoupons(userId: string) {
  return useQuery({
    queryKey: queryKeys.coupons.used(userId),
    queryFn: () => getUsedCoupons(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos (menos dinámico)
  })
}

// 🔄 MUTACIÓN PARA USAR CUPÓN
export function useUseCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ couponId, userId }: { couponId: string; userId: string }) => 
      useCoupon(couponId, userId),
    onSuccess: (data, variables) => {
      // Invalidar todos los queries de cupones del usuario
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

// 🔄 FUNCIÓN HELPER PARA REFRESCAR CUPONES
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
