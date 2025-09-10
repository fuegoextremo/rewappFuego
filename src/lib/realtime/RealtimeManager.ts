import { createClientBrowser } from '@/lib/supabase/client'
import type { QueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppDispatch } from '@/store'
import type { CouponRow } from '@/store/slices/authSlice'

// 🎯 Tipos para los datos específicos
interface CheckinData {
  id: string
  user_id: string
  branch_id: string
  check_in_date: string
  spins_earned?: number
  created_at: string
}

interface StreakData {
  id: string
  user_id: string
  current_count: number
  expires_at: string | null
  last_check_in: string | null
}

interface CouponData {
  id: string
  user_id: string
  prize_id: string
  unique_code: string | null
  expires_at: string | null
  is_redeemed: boolean | null
  redeemed_at: string | null
  source: string | null
  created_at: string | null
}

// 🎯 Payload simplificado para Realtime
interface RealtimePayload {
  eventType: string
  new: Record<string, unknown> | null
  old: Record<string, unknown> | null
}

interface RealtimeEventCallbacks {
  onUserSpinsUpdate?: (data: { userId: string; availableSpins: number }) => void
  onCheckinUpdate?: (data: { userId: string; checkinData: CheckinData }) => void
  onCouponUpdate?: (data: { userId: string; couponData: CouponData }) => void
  onStreakUpdate?: (data: { userId: string; streakData: StreakData }) => void
}

export class RealtimeManager {
  private static instance: RealtimeManager | null = null
  private supabaseClient: ReturnType<typeof createClientBrowser>
  private channel: RealtimeChannel | null = null
  private currentUserId: string | null = null
  private callbacks: RealtimeEventCallbacks = {}
  private queryClient: QueryClient | null = null
  private reduxDispatch: AppDispatch | null = null
  private isConfigured: boolean = false

  private constructor() {
    // Cliente Supabase compartido - usa el mismo que el resto de la app
    this.supabaseClient = createClientBrowser()
  }

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  // Configurar dependencies (QueryClient + Redux dispatch)
  configure(queryClient: QueryClient, dispatch: AppDispatch) {
    // Evitar reconfiguración múltiple
    if (this.isConfigured && this.queryClient === queryClient && this.reduxDispatch === dispatch) {
      return
    }

    this.queryClient = queryClient
    this.reduxDispatch = dispatch
    this.isConfigured = true
  }

  // Conectar para un usuario específico
  connect(userId: string) {
    if (this.currentUserId === userId && this.channel) {
      return
    }

    // Desconectar anterior si existe
    this.disconnect()

    this.currentUserId = userId

    this.channel = this.supabaseClient
      .channel(`realtime-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_spins'
      }, (payload: RealtimePayload) => {
        this.handleUserSpinsChange(payload)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins'
      }, (payload: RealtimePayload) => {
        console.log('🔍 RealtimeManager: Raw checkin event recibido:', payload)
        this.handleCheckinChange(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'streaks',
        filter: `user_id=eq.${userId}`
      }, (payload: RealtimePayload) => {
        this.handleStreakChange(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coupons'
      }, (payload: RealtimePayload) => {
        this.handleCouponChange(payload)
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // Conexión exitosa
        }
      })
  }

  // Desconectar
  disconnect() {
    if (this.channel) {
      console.log('🔌 RealtimeManager desconectando...')
      this.supabaseClient.removeChannel(this.channel)
      this.channel = null
      this.currentUserId = null
    }
  }

  // Handlers para eventos específicos
  private handleUserSpinsChange(payload: RealtimePayload) {
    if (payload.new && payload.new.user_id === this.currentUserId) {
      const newSpins = payload.new.available_spins as number
      
      // ✨ Actualizar solo Redux - fuente única de verdad
      if (this.reduxDispatch) {
        // Importamos dinámicamente para evitar dependencias circulares
        import('@/store/slices/authSlice').then(({ updateAvailableSpins }) => {
          this.reduxDispatch!(updateAvailableSpins(newSpins))
        })
      }

      // Callback opcional
      this.callbacks.onUserSpinsUpdate?.({
        userId: this.currentUserId!,
        availableSpins: newSpins
      })
    }
  }

  private handleCheckinChange(payload: RealtimePayload) {
    console.log('🔍 RealtimeManager: handleCheckinChange llamado con:', payload)
    if (payload.new && payload.new.user_id === this.currentUserId) {
      console.log('🔥 RealtimeManager: Checkin payload completo:', payload.new)
      
      // ✨ Actualización granular - solo Redux como fuente única de verdad
      if (this.reduxDispatch) {
        import('@/store/slices/authSlice').then(({ 
          incrementTotalCheckins, 
          addAvailableSpins,
          prependRecentActivity
        }) => {
          // Incrementar visitas totales
          this.reduxDispatch!(incrementTotalCheckins())
          console.log('🔥 RealtimeManager: ✅ Incrementando total_checkins')
          
          // Si el checkin otorga giros, agregarlos
          if (payload.new?.spins_earned && (payload.new.spins_earned as number) > 0) {
            this.reduxDispatch!(addAvailableSpins(payload.new.spins_earned as number))
            console.log('🔥 RealtimeManager: ✅ Agregando giros:', payload.new.spins_earned)
          }
          
          // 🔥 NUEVO: Agregar el check-in a recentActivity en Redux
          const newCheckin = {
            id: payload.new?.id as string,
            check_in_date: payload.new?.check_in_date as string | null,
            spins_earned: payload.new?.spins_earned as number | null,
            created_at: payload.new?.created_at as string | null,
            branches: null // Se puede cargar después si es necesario
          }
          this.reduxDispatch!(prependRecentActivity(newCheckin))
          console.log('🔥 RealtimeManager: ✅ Agregando check-in a recentActivity')
        })
      }

      // ✨ TRANSICIÓN: Mantener invalidación de React Query durante migración
      if (this.queryClient) {
        // Solo invalidar actividad reciente - el resto usa Redux
        console.log('🔍 RealtimeManager: Invalidando query checkins para userId:', this.currentUserId)
        this.queryClient.invalidateQueries({ queryKey: ['user', 'checkins', this.currentUserId] })
      }

      this.callbacks.onCheckinUpdate?.({
        userId: this.currentUserId!,
        checkinData: payload.new as unknown as CheckinData
      })
    }
  }

  private handleStreakChange(payload: RealtimePayload) {
    if (payload.new && payload.new.user_id === this.currentUserId) {
      console.log('🔥 RealtimeManager: Streak payload completo:', payload.new)
      
      // ✨ Actualización granular de racha usando Redux
      if (this.reduxDispatch) {
        import('@/store/slices/authSlice').then(({ updateCurrentStreak, updateUserStreakData }) => {
          const streakCount = payload.new?.current_count as number
          if (typeof streakCount === 'number' && streakCount >= 0) {
            this.reduxDispatch!(updateCurrentStreak(streakCount))
            console.log('🔥 RealtimeManager: ✅ Actualizando current_streak:', streakCount)
            
            // 🔥 NUEVO: También actualizar streakData completo
            const streakData = {
              current_count: streakCount,
              expires_at: payload.new?.expires_at as string | null,
              last_check_in: payload.new?.last_check_in as string | null
            }
            this.reduxDispatch!(updateUserStreakData(streakData))
            console.log('🔥 RealtimeManager: ✅ Actualizando streakData completo:', streakData)
          }
        })
      }

      this.callbacks.onStreakUpdate?.({
        userId: this.currentUserId!,
        streakData: payload.new as unknown as StreakData
      })
    }
  }

  private handleCouponChange(payload: RealtimePayload) {
    if (payload.new && payload.new.user_id === this.currentUserId) {
      // ✨ Actualizar Redux directamente - fuente única de verdad
      if (this.reduxDispatch) {
        import('@/store/slices/authSlice').then(async ({ 
          addActiveCoupon, 
          prependExpiredCoupon, 
          moveCouponToExpired,
          updateCouponDetails 
        }) => {
          const coupon = payload.new as Record<string, unknown> // Type assertion for payload
          if (!coupon) return

          const isExpired = coupon.expires_at && new Date(coupon.expires_at as string).getTime() < Date.now()
          
          // 🎯 Para cupones nuevos, obtener la información completa del premio
          if (payload.eventType === 'INSERT' && coupon.prize_id) {
            try {
              const supabaseClient = (await import('@/lib/supabase/client')).createClientBrowser()
              const { data: couponWithPrize } = await supabaseClient
                .from('coupons')
                .select(`
                  id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
                  prizes ( name, image_url )
                `)
                .eq('id', coupon.id as string)
                .single()
              
              if (couponWithPrize) {
                Object.assign(coupon, couponWithPrize)
              }
            } catch (error) {
              console.error('❌ Error al obtener datos del premio:', error)
            }
          }
          
          if (payload.eventType === 'INSERT') {
            // Cupón nuevo creado
            if (!coupon.is_redeemed && !isExpired) {
              this.reduxDispatch!(addActiveCoupon(coupon as unknown as CouponRow))
            } else {
              this.reduxDispatch!(prependExpiredCoupon(coupon as unknown as CouponRow))
            }
          } else if (payload.eventType === 'UPDATE') {
            // Cupón actualizado
            if (coupon.is_redeemed || isExpired) {
              this.reduxDispatch!(moveCouponToExpired(coupon as unknown as CouponRow))
            } else {
              this.reduxDispatch!(updateCouponDetails(coupon as unknown as CouponRow))
            }
          }
        })
      }

      this.callbacks.onCouponUpdate?.({
        userId: this.currentUserId!,
        couponData: payload.new as unknown as CouponData
      })
    }
  }

  // API para suscribirse a eventos específicos
  onUserSpinsUpdate(callback: (data: { userId: string; availableSpins: number }) => void) {
    this.callbacks.onUserSpinsUpdate = callback
  }

  onCheckinUpdate(callback: (data: { userId: string; checkinData: CheckinData }) => void) {
    this.callbacks.onCheckinUpdate = callback
  }

  onCouponUpdate(callback: (data: { userId: string; couponData: CouponData }) => void) {
    this.callbacks.onCouponUpdate = callback
  }

  // Status
  isConnected(): boolean {
    return this.channel !== null && this.currentUserId !== null
  }

  getCurrentUserId(): string | null {
    return this.currentUserId
  }
}

// Export de la instancia singleton
export const realtimeManager = RealtimeManager.getInstance()
