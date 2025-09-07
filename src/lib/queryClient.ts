import { QueryClient } from '@tanstack/react-query'

// 🎯 CONFIGURACIÓN DEL QUERY CLIENT PARA REWAPP
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por defecto
      staleTime: 5 * 60 * 1000,
      // Mantener datos en cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry solo 1 vez en caso de error
      retry: 1,
      // No refetch automático en window focus (evita consultas innecesarias)
      refetchOnWindowFocus: false,
      // Refetch en reconexión de red
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations 1 vez
      retry: 1,
    },
  },
})

// 🏷️ QUERY KEYS CENTRALIZADOS (evita duplicación y errores)
export const queryKeys = {
  // Usuario
  user: {
    profile: (userId: string) => ['user', 'profile', userId],
    checkins: (userId: string) => ['user', 'checkins', userId],
    coupons: (userId: string) => ['user', 'coupons', userId],
    stats: (userId: string) => ['user', 'stats', userId],
  },
  // Sistema
  system: {
    settings: ['system', 'settings'],
    branches: ['system', 'branches'],
    prizes: ['system', 'prizes'],
  },
  // Dinámicos (con filtros)
  checkins: {
    list: (filters: Record<string, any>) => ['checkins', 'list', filters],
  },
  coupons: {
    available: (userId: string) => ['coupons', 'available', userId],
    used: (userId: string) => ['coupons', 'used', userId],
  },
} as const
