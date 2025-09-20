import { QueryClient } from '@tanstack/react-query'

// 🎯 CONFIGURACIÓN DEL QUERY CLIENT PARA REWAPP
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // SIN CACHE - Redux es fuente única de verdad
      staleTime: 0,
      // Mantener datos en cache solo 1 minuto (mínimo)
      gcTime: 1 * 60 * 1000,
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
    streak: (userId: string) => ['user', 'streak', userId],
    spins: (userId: string) => ['user', 'spins', userId],
  },
  // Sistema
  system: {
    settings: ['system', 'settings'],
    branches: ['system', 'branches'],
    prizes: ['system', 'prizes'],
  },
  // Dinámicos (con filtros)
  checkins: {
    list: (filters: Record<string, unknown>) => ['checkins', 'list', filters],
  },
  coupons: {
    available: (userId: string) => ['coupons', 'available', userId],
    used: (userId: string) => ['coupons', 'used', userId],
  },
  // Streaks
  streaks: {
    prizes: ['streaks', 'prizes'],
    settings: ['streaks', 'settings'],
  },
  // Roulette
  roulette: {
    prizes: ['roulette', 'prizes'],
    spins: (userId: string) => ['roulette', 'spins', userId],
  },
} as const
