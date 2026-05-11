import { useQuery } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/client'

// 🎯 Interface para check-ins con datos completos
interface CheckIn {
  id: string
  check_in_date: string | null
  spins_earned: number | null
  created_at: string | null // ⭐ Hora exacta del check-in
  branches?: {
    name: string
  } | null
}

// 🎯 Hook para actividad reciente con React Query
export function useRecentActivity(userId: string) {
  return useQuery({
    queryKey: ['user', 'checkins', userId], // ⭐ Misma key que invalida RealtimeManager
    queryFn: async () => {
      console.log('🔍 useRecentActivity queryFn ejecutando para userId:', userId)
      const supabase = createClientBrowser()
      const ITEMS_PER_PAGE = 10
      
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          check_in_date,
          spins_earned,
          created_at,
          branches (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(ITEMS_PER_PAGE)

      if (error) throw error
      
      console.log('🔍 useRecentActivity data loaded:', { 
        count: data?.length, 
        latest: data?.[0]?.created_at 
      })
      
      return data || []
    },
    enabled: !!userId,
    staleTime: 30 * 1000,         // ✨ 30 segundos - se actualiza con realtime
    gcTime: 5 * 60 * 1000,        // ✨ 5 minutos en cache
    refetchOnWindowFocus: false,   // ✨ Confiar en Realtime para updates
  })
}

// 🎯 Helper para formatear fecha y hora
// NOTA: check_in_date es la fecha REAL de la visita, created_at es cuando se insertó en DB
export function formatCheckInDateTime(created_at: string | null, check_in_date: string | null): string {
  if (!created_at && !check_in_date) return 'Fecha no disponible'
  
  // Usar created_at para la hora exacta. check_in_date es solo DATE sin hora.
  const date = created_at ? new Date(created_at) : new Date(check_in_date!)
  const now = new Date()
  const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  // Si es el mismo día, mostrar "Hoy HH:mm"
  if (date.toDateString() === now.toDateString()) {
    return `Hoy ${date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`
  }
  
  // Si fue ayer, mostrar "Ayer HH:mm"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ayer ${date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`
  }
  
  // Si es hace menos de 7 días, mostrar "15 oct, 14:30"
  if (diffHours < 24 * 7) {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    }) + `, ${date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`
  }
  
  // Para fechas más antiguas, solo mostrar fecha
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export type { CheckIn }
