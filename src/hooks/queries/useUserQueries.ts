import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserProfile, getUserCheckins, getUserStats, updateUserProfile } from '@/lib/api/user'
import { queryKeys } from '@/lib/queryClient'

// 🎯 HOOKS DE REACT QUERY PARA DATOS DE USUARIO

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useUserCheckins(userId: string, limit = 50) {
  return useQuery({
    queryKey: queryKeys.user.checkins(userId),
    queryFn: () => getUserCheckins(userId, limit),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos (más dinámico)
  })
}

export function useUserStats(userId: string) {
  return useQuery({
    queryKey: queryKeys.user.stats(userId),
    queryFn: () => getUserStats(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minuto (muy dinámico)
  })
}

// 🔄 MUTACIÓN PARA ACTUALIZAR PERFIL
export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, updates }: { 
      userId: string
      updates: Parameters<typeof updateUserProfile>[1] 
    }) => updateUserProfile(userId, updates),
    onSuccess: (data, variables) => {
      // Invalidar y actualizar cache del perfil
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.user.profile(variables.userId) 
      })
      
      // Opcionalmente, actualizar directamente el cache
      queryClient.setQueryData(
        queryKeys.user.profile(variables.userId), 
        data
      )
    },
    onError: (error) => {
      console.error('❌ Error updating profile:', error)
    }
  })
}

// 🔄 FUNCIÓN HELPER PARA INVALIDAR TODOS LOS DATOS DEL USUARIO
export function useInvalidateUserData() {
  const queryClient = useQueryClient()

  return (userId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['user', userId] 
    })
  }
}
