import { createClientBrowser } from '@/lib/supabase/client'
import type { QueryClient } from '@tanstack/react-query'

interface RealtimeEventCallbacks {
  onUserSpinsUpdate?: (data: { userId: string; availableSpins: number }) => void
  onCheckinUpdate?: (data: { userId: string; checkinData: any }) => void
  onCouponUpdate?: (data: { userId: string; couponData: any }) => void
}

export class RealtimeManager {
  private static instance: RealtimeManager | null = null
  private supabaseClient: any
  private channel: any = null
  private currentUserId: string | null = null
  private callbacks: RealtimeEventCallbacks = {}
  private queryClient: QueryClient | null = null
  private reduxDispatch: any = null
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
  configure(queryClient: QueryClient, dispatch: any) {
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
      }, (payload: any) => {
        this.handleUserSpinsChange(payload)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins'
      }, (payload: any) => {
        this.handleCheckinChange(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coupons'
      }, (payload: any) => {
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
  private handleUserSpinsChange(payload: any) {
    if (payload.new && payload.new.user_id === this.currentUserId) {
      const newSpins = payload.new.available_spins
      
      // ✨ Actualizar solo Redux - fuente única de verdad
      if (this.reduxDispatch) {
        // Importamos dinámicamente para evitar dependencias circulares
        import('@/store/slices/authSlice').then(({ updateAvailableSpins }) => {
          this.reduxDispatch(updateAvailableSpins(newSpins))
        })
      }

      // Callback opcional
      this.callbacks.onUserSpinsUpdate?.({
        userId: this.currentUserId!,
        availableSpins: newSpins
      })
    }
  }

  private handleCheckinChange(payload: any) {
    if (payload.new && payload.new.user_id === this.currentUserId) {
      // ✨ Solo actualizar Redux - fuente única de verdad
      if (this.reduxDispatch) {
        import('@/store/slices/authSlice').then(({ loadUserProfile }) => {
          this.reduxDispatch(loadUserProfile(this.currentUserId!))
        })
      }

      this.callbacks.onCheckinUpdate?.({
        userId: this.currentUserId!,
        checkinData: payload.new
      })
    }
  }

  private handleCouponChange(payload: any) {
    if (payload.new && payload.new.user_id === this.currentUserId) {
      // ✨ Actualizar Redux directamente - fuente única de verdad
      if (this.reduxDispatch) {
        import('@/store/slices/authSlice').then(({ 
          addActiveCoupon, 
          prependExpiredCoupon, 
          moveCouponToExpired,
          updateCouponDetails 
        }) => {
          const coupon = payload.new
          const isExpired = coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()
          
          if (payload.event === 'INSERT') {
            // Cupón nuevo creado
            if (!coupon.is_redeemed && !isExpired) {
              this.reduxDispatch(addActiveCoupon(coupon))
            } else {
              this.reduxDispatch(prependExpiredCoupon(coupon))
            }
          } else if (payload.event === 'UPDATE') {
            // Cupón actualizado
            if (coupon.is_redeemed || isExpired) {
              this.reduxDispatch(moveCouponToExpired(coupon))
            } else {
              this.reduxDispatch(updateCouponDetails(coupon))
            }
          }
        })
      }

      this.callbacks.onCouponUpdate?.({
        userId: this.currentUserId!,
        couponData: payload.new
      })
    }
  }

  // API para suscribirse a eventos específicos
  onUserSpinsUpdate(callback: (data: { userId: string; availableSpins: number }) => void) {
    this.callbacks.onUserSpinsUpdate = callback
  }

  onCheckinUpdate(callback: (data: { userId: string; checkinData: any }) => void) {
    this.callbacks.onCheckinUpdate = callback
  }

  onCouponUpdate(callback: (data: { userId: string; couponData: any }) => void) {
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
