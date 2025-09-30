import { createClientBrowser } from '@/lib/supabase/client'
import type { QueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppDispatch } from '@/store'
import type { CouponRow } from '@/store/slices/authSlice'
// 🔔 NUEVO: Importar NotificationService de forma SEGURA
import NotificationService from '@/lib/services/notifications'

// 🚀 FASE 1.3: Sistema de logging estructurado
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: Record<string, unknown>
}

class RealtimeLogger {
  private static formatTimestamp(): string {
    return new Date().toISOString()
  }

  private static formatLogEntry(level: LogLevel, context: string, message: string, data?: Record<string, unknown>): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      context,
      message,
      data
    }
  }

  static info(context: string, message: string, data?: Record<string, unknown>) {
    const entry = this.formatLogEntry('info', context, message, data)
    console.log(`🔵 [${entry.timestamp}] [RealtimeManager::${entry.context}] ${entry.message}`, entry.data || '')
  }

  static warn(context: string, message: string, data?: Record<string, unknown>) {
    const entry = this.formatLogEntry('warn', context, message, data)
    console.warn(`🟡 [${entry.timestamp}] [RealtimeManager::${entry.context}] ${entry.message}`, entry.data || '')
  }

  static error(context: string, message: string, data?: Record<string, unknown>) {
    const entry = this.formatLogEntry('error', context, message, data)
    console.error(`🔴 [${entry.timestamp}] [RealtimeManager::${entry.context}] ${entry.message}`, entry.data || '')
  }

  static debug(context: string, message: string, data?: Record<string, unknown>) {
    const entry = this.formatLogEntry('debug', context, message, data)
    console.log(`🔍 [${entry.timestamp}] [RealtimeManager::${entry.context}] ${entry.message}`, entry.data || '')
  }
}

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
  completed_count: number      // 🆕 Contador de rachas completadas
  is_just_completed: boolean   // 🆕 Flag para UI "recién completada"
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
  private recentCheckinTimestamp: number | null = null // 🔔 NUEVO: Para detectar giros de admin vs check-in
  
  // 🚀 FASE 1.2: Page Visibility API
  private isPaused: boolean = false
  private visibilityListener: (() => void) | null = null
  private windowBlurListener: (() => void) | null = null
  private windowFocusListener: (() => void) | null = null

  private constructor() {
    // Cliente Supabase compartido - usa el mismo que el resto de la app
    this.supabaseClient = createClientBrowser()
    
    // 🚀 FASE 1.2: Inicializar Page Visibility API
    this.initializePageVisibility()
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
      RealtimeLogger.debug('connect', 'Usuario ya conectado, evitando reconexión', { userId })
      return
    }

    // 🔧 No conectar si estamos pausados (a menos que sea desde resume())
    if (this.isPaused) {
      RealtimeLogger.debug('connect', 'Conexión pausada - deferiendo hasta resume', { userId })
      this.currentUserId = userId // Guardar para reconectar en resume
      return
    }

    // Desconectar anterior si existe
    this.disconnect()

    this.currentUserId = userId
    RealtimeLogger.info('connect', 'Iniciando conexión realtime unificada', { userId })

    // 🚀 OPTIMIZACIÓN FASE 1.1: Conexión unificada en lugar de 4 separadas
    this.channel = this.supabaseClient
      .channel(`unified-realtime-${userId}`)
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
        RealtimeLogger.debug('check-ins', 'Raw checkin event recibido', { payload })
        console.log('🟡 CHECK-IN EVENT recibido:', {
          eventType: payload.eventType,
          userId: payload.new?.user_id,
          currentUserId: this.currentUserId,
          isMyEvent: payload.new?.user_id === this.currentUserId
        });
        this.handleCheckinChange(payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'streaks',
        filter: `user_id=eq.${userId}`
      }, (payload: RealtimePayload) => {
        console.log('🟢 STREAK EVENT recibido:', {
          eventType: payload.eventType,
          userId: payload.new?.user_id,
          currentUserId: this.currentUserId,
          currentCount: payload.new?.current_count
        });
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
          RealtimeLogger.info('connect', 'Conexión unificada establecida exitosamente', { userId })
        } else if (status === 'CHANNEL_ERROR') {
          RealtimeLogger.error('connect', 'Error en canal realtime', { userId, status })
        } else {
          RealtimeLogger.debug('connect', 'Estado de canal', { userId, status })
        }
      })
  }

  // Desconectar
  disconnect() {
    if (this.channel) {
      RealtimeLogger.info('disconnect', 'Desconectando canal realtime', { userId: this.currentUserId })
      this.supabaseClient.removeChannel(this.channel)
      this.channel = null
      this.currentUserId = null
    }
    
    // 🚀 IMPORTANTE: NO hacer cleanup de Page Visibility aquí
    // ❌ this.cleanupPageVisibility() - Se mantiene activo para el singleton
    // 🔄 Solo reset el estado de pausa
    this.isPaused = false
  }

  // Handlers para eventos específicos
  private handleUserSpinsChange(payload: RealtimePayload) {
    if (payload.new && payload.new.user_id === this.currentUserId) {
      const newSpins = payload.new.available_spins as number
      const oldSpins = (payload.old?.available_spins as number) || 0
      
      RealtimeLogger.info('user-spins', 'Cambio en spins detectado', { 
        oldSpins, 
        newSpins, 
        diff: newSpins - oldSpins,
        userId: this.currentUserId 
      })
      
      // ✨ Actualizar solo Redux - fuente única de verdad para giros
      if (this.reduxDispatch) {
        // Importamos dinámicamente para evitar dependencias circulares
        import('@/store/slices/authSlice').then(({ updateAvailableSpins }) => {
          this.reduxDispatch!(updateAvailableSpins(newSpins))
          RealtimeLogger.info('user-spins', 'Redux store actualizado exitosamente', { newSpins })
        })
      }

      // 🔔 NUEVO: Notificación de giros otorgados por admin
      try {
        // Si hay un aumento de giros y NO es de check-in reciente
        if (payload.eventType === 'UPDATE' && newSpins > oldSpins) {
          const spinsAdded = newSpins - oldSpins
          
          // Usar timeout para evitar conflicto con notificación de check-in
          setTimeout(() => {
            // Solo mostrar si no hubo check-in muy reciente (detectar admin)
            if (!this.recentCheckinTimestamp || Date.now() - this.recentCheckinTimestamp > 2000) {
              NotificationService.notifyManualSpins(spinsAdded)
              RealtimeLogger.info('notifications', 'Toast giros admin mostrado exitosamente')
            }
          }, 1000) // Delay para evitar solapamiento
        }
      } catch (error) {
        RealtimeLogger.warn('notifications', 'Error en toast giros admin', { error })
        // NO ROMPE NADA - continúa normalmente
      }

      // Callback opcional
      this.callbacks.onUserSpinsUpdate?.({
        userId: this.currentUserId!,
        availableSpins: newSpins
      })
    }
  }

  private handleCheckinChange(payload: RealtimePayload) {
    RealtimeLogger.debug('check-ins', 'handleCheckinChange llamado', { payload })
    if (payload.new && payload.new.user_id === this.currentUserId) {
      RealtimeLogger.info('check-ins', 'Nuevo checkin detectado para usuario actual', { 
        payload: payload.new,
        userId: this.currentUserId 
      })
      
      // 🔔 NUEVO: Marcar timestamp de check-in para diferenciar de giros de admin
      this.recentCheckinTimestamp = Date.now()
      
      // ✨ Actualización granular - solo Redux como fuente única de verdad
      if (this.reduxDispatch) {
        import('@/store/slices/authSlice').then(({ 
          incrementTotalCheckins, 
          prependRecentActivity
        }) => {
          // Incrementar visitas totales
          this.reduxDispatch!(incrementTotalCheckins())
          RealtimeLogger.info('check-ins', 'Incrementando total_checkins en Redux')
          
          // 🔄 NUEVO: Los giros se actualizan solo via user_spins (evita race condition)
          RealtimeLogger.debug('check-ins', 'Giros se actualizarán via evento user_spins')
          
          // 🔥 NUEVO: Agregar el check-in a recentActivity en Redux
          const newCheckin = {
            id: payload.new?.id as string,
            check_in_date: payload.new?.check_in_date as string | null,
            spins_earned: payload.new?.spins_earned as number | null,
            created_at: payload.new?.created_at as string | null,
            branches: null // Se puede cargar después si es necesario
          }
          this.reduxDispatch!(prependRecentActivity(newCheckin))
          console.log('🔥 RealtimeManager: ✅ Agregando check-in a recentActivity:', newCheckin)
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

      // 🔔 NUEVO: Notificación de check-in exitoso (SEGURO - al final)
      try {
        const spinsEarned = (payload.new?.spins_earned as number) || 1
        NotificationService.notifyCheckinSuccess(spinsEarned, () => {
          // Disparar evento para cerrar CheckinSheet
          window.dispatchEvent(new CustomEvent('checkin-success'))
        })
        console.log('🔔 RealtimeManager: ✅ Toast check-in mostrado + evento para cerrar sheet')
      } catch (error) {
        console.warn('🔔 RealtimeManager: Error en toast check-in:', error)
        // NO ROMPE NADA - continúa normalmente
      }
    }
  }

  private handleStreakChange(payload: RealtimePayload) {
    if (payload.new && payload.new.user_id === this.currentUserId) {
      console.log('🔥 RealtimeManager: Streak payload completo:', payload.new)
      
      // ✨ Actualización granular de racha usando Redux (OPTIMIZADO: solo una dispatch)
      if (this.reduxDispatch) {
        import('@/store/slices/authSlice').then(({ updateUserStreakData }) => {
          const streakCount = payload.new?.current_count as number
          if (typeof streakCount === 'number' && streakCount >= 0) {
            
            // 🔍 LOG DETALLADO: Estado antes y después
            console.log('🟦 REALTIME → REDUX: ANTES DE ACTUALIZAR');
            console.log('📊 Datos del realtime:', {
              current_count: streakCount,
              completed_count: payload.new?.completed_count,
              is_just_completed: payload.new?.is_just_completed,
              user_id: payload.new?.user_id
            });
            
            // 🔥 OPTIMIZADO: Solo una actualización completa, evita doble re-render
            const streakData = {
              current_count: streakCount,
              completed_count: (payload.new?.completed_count as number) || 0,
              is_just_completed: (payload.new?.is_just_completed as boolean) || false,
              expires_at: payload.new?.expires_at as string | null,
              last_check_in: payload.new?.last_check_in as string | null
            }
            
            this.reduxDispatch!(updateUserStreakData(streakData))
            
            // 🎯 FASE 1: Log prioritario para last_check_in
            console.log('� [FASE1] Realtime → Redux: last_check_in =', streakData.last_check_in);
          }
        })
      }

      this.callbacks.onStreakUpdate?.({
        userId: this.currentUserId!,
        streakData: payload.new as unknown as StreakData
      })

      // 🔔 NUEVO: Notificación de racha completada (SEGURO - al final)
      try {
        const isJustCompleted = payload.new?.is_just_completed as boolean
        if (isJustCompleted) {
          const completedCount = (payload.new?.completed_count as number) || 1
          NotificationService.notifyStreakCompleted(completedCount)
          console.log('🔔 RealtimeManager: ✅ Toast racha completada mostrado')
        }
      } catch (error) {
        console.warn('🔔 RealtimeManager: Error en toast racha:', error)
        // NO ROMPE NADA - continúa normalmente
      }
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

      // 🔔 MEJORADO: Notificación de cupón obtenido con datos reales
      this.handleCouponNotification(payload).catch(error => {
        console.warn('🔔 RealtimeManager: Error en handleCouponNotification:', error)
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
    return this.channel !== null && this.currentUserId !== null && !this.isPaused
  }

  // 🔔 HELPER: Manejo de notificaciones de cupones
  private async handleCouponNotification(payload: RealtimePayload) {
    try {
      if (payload.eventType === 'INSERT') {
        const coupon = payload.new as Record<string, unknown>
        const source = coupon.source as string
        const prizeId = coupon.prize_id as string
        
        // Obtener información del premio desde Supabase
        const prizeInfo = await this.getPrizeInfoForCoupon(prizeId)
        
        // Notificación específica según el tipo de cupón
        if (source === 'streak') {
          const threshold = prizeInfo?.streak_threshold || 5 // Fallback
          const prizeName = prizeInfo?.name
          NotificationService.notifyCouponByStreak(threshold, prizeName)
          console.log('🔔 RealtimeManager: ✅ Toast cupón por RACHA mostrado')
        } else if (source === 'manual') {
          const prizeName = prizeInfo?.name || 'Premio especial'
          NotificationService.notifyManualCoupon(prizeName)
          console.log('🔔 RealtimeManager: ✅ Toast cupón MANUAL mostrado')
        } else if (source === 'roulette') {
          const prizeName = prizeInfo?.name || 'Premio de ruleta'
          NotificationService.notifyRoulettePrize(prizeName, () => {
            // Disparar evento para cerrar RedeemSheet
            window.dispatchEvent(new CustomEvent('redemption-success'))
          })
          console.log('🔔 RealtimeManager: ⏳ Toast cupón por RULETA programado (con delay de 5.5s) + evento para cerrar sheet')
        } else {
          // Fallback para otros tipos
          const prizeName = prizeInfo?.name || 'Premio sorpresa'
          NotificationService.notifyManualCoupon(prizeName)
          console.log('🔔 RealtimeManager: ✅ Toast cupón genérico mostrado')
        }
      }
    } catch (error) {
      console.warn('🔔 RealtimeManager: Error en toast cupón:', error)
      // NO ROMPE NADA - continúa normalmente
    }
  }

  // 🔔 HELPER: Obtener información del premio
  private async getPrizeInfoForCoupon(prizeId: string): Promise<{ name: string; streak_threshold?: number | null } | null> {
    try {
      const supabase = createClientBrowser()
      const { data: prize, error } = await supabase
        .from('prizes')
        .select('name, streak_threshold')
        .eq('id', prizeId)
        .single()

      if (error) {
        console.warn('🔔 RealtimeManager: Error obteniendo premio:', error)
        return null
      }

      return prize
    } catch (error) {
      console.warn('🔔 RealtimeManager: Error en getPrizeInfoForCoupon:', error)
      return null
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  // 🚀 FASE 1.2: Page Visibility API Implementation
  private initializePageVisibility() {
    if (typeof window === 'undefined') return // Solo en cliente
    
    // 🚀 Evitar múltiples listeners - solo si no existe ya
    if (this.visibilityListener) {
      console.log('⚠️ Page Visibility ya inicializado - evitando duplicados')
      return
    }
    
    this.visibilityListener = () => {
      if (document.hidden) {
        console.log('🌙 PESTAÑA OCULTA - RealtimeManager pausando...')
        this.pause()
      } else {
        console.log('📱 PESTAÑA VISIBLE - RealtimeManager resumiendo...')
        this.resume()
      }
    }
    
    // 🎯 Window Focus Listeners
    this.windowBlurListener = () => {
      console.log('🌙 VENTANA SIN FOCO - RealtimeManager pausando...')
      this.pause()
    }
    
    this.windowFocusListener = () => {
      console.log('📱 VENTANA CON FOCO - RealtimeManager resumiendo...')
      this.resume()
    }
    
    // 🎯 Page Visibility API - pausa cuando la pestaña se oculta
    document.addEventListener('visibilitychange', this.visibilityListener)
    
    // 🎯 Window Focus API - pausa cuando la ventana pierde foco
    window.addEventListener('blur', this.windowBlurListener)
    window.addEventListener('focus', this.windowFocusListener)
    
    console.log('✅ Page Visibility API y Window Focus inicializados - Cambiar de pestaña o foco para ver logs')
    RealtimeLogger.info('page-visibility', 'Page Visibility API y Window Focus inicializados exitosamente')
  }
  
  private pause() {
    if (this.isPaused) return
    
    console.log('🔴 PAUSE: Conexión realtime pausada por Page Visibility API')
    RealtimeLogger.info('page-visibility', 'Pausando conexión realtime (pestaña oculta)', { 
      userId: this.currentUserId,
      hadChannel: !!this.channel
    })
    this.isPaused = true
    
    // Solo remover canal si existe - permite pausar incluso sin conexión activa
    if (this.channel) {
      this.supabaseClient.removeChannel(this.channel)
      this.channel = null // 🔧 CRUCIAL: limpiar referencia para permitir reconexión
      console.log('📡 Canal Supabase removido y referencia limpiada')
    } else {
      console.log('📡 Pausa registrada sin canal activo (conexión aún no establecida)')
    }
  }
  
  private resume() {
    if (!this.isPaused) return
    
    console.log('🟢 RESUME: Conexión realtime resumida por Page Visibility API')
    RealtimeLogger.info('page-visibility', 'Resumiendo conexión realtime (pestaña visible)', { 
      userId: this.currentUserId,
      willReconnect: !!this.currentUserId
    })
    this.isPaused = false
    
    // Solo reconectar si tenemos un userId (puede que se haya pausado antes de la conexión inicial)
    if (this.currentUserId) {
      // 🔧 Forzar reconexión completa ya que el canal fue limpiado en pause()
      const userIdToReconnect = this.currentUserId
      this.currentUserId = null // Limpiar para forzar nueva conexión
      this.connect(userIdToReconnect)
      
      // 🔄 SIMPLE SYNC: Siempre sincronizar datos frescos al reconectar
      this.syncFreshDataAfterResume(userIdToReconnect)
      
      console.log('🔄 Reconexión completa con canal nuevo')
    } else {
      console.log('🔄 Resume sin userId - esperando conexión inicial')
    }
  }

  // 🔄 SIMPLE SYNC: Siempre fetch datos frescos al reconectar (OPCIÓN 1)
  private syncFreshDataAfterResume(userId: string) {
    console.log('🔄 SYNC: Obteniendo datos frescos después de reconexión')
    
    // 1. Sincronizar Redux (datos críticos para UI)
    if (this.reduxDispatch) {
      import('@/store/slices/authSlice').then(({ loadUserProfile }) => {
        this.reduxDispatch!(loadUserProfile(userId))
        console.log('🔄 Redux: loadUserProfile ejecutado para datos frescos')
      })
    }
    
    // 2. Mantener sincronización de React Query (datos auxiliares)
    if (this.queryClient) {
      console.log('🔄 React Query: Invalidando queries para datos frescos...')
      this.queryClient.invalidateQueries({ queryKey: ['user', 'spins', userId] })
      this.queryClient.invalidateQueries({ queryKey: ['user', 'streaks', userId] })
      this.queryClient.invalidateQueries({ queryKey: ['user', 'coupons', userId] })
      RealtimeLogger.info('page-visibility', 'Datos sincronizados después de reconexión', { userId })
    }
  }

  // Cleanup para evitar memory leaks
  private cleanupPageVisibility() {
    if (typeof window !== 'undefined') {
      // Remover Page Visibility listener
      if (this.visibilityListener) {
        document.removeEventListener('visibilitychange', this.visibilityListener)
        this.visibilityListener = null
      }
      
      // Remover Window Focus listeners
      if (this.windowBlurListener) {
        window.removeEventListener('blur', this.windowBlurListener)
        this.windowBlurListener = null
      }
      
      if (this.windowFocusListener) {
        window.removeEventListener('focus', this.windowFocusListener)
        this.windowFocusListener = null
      }
      
      RealtimeLogger.debug('page-visibility', 'Page Visibility y Window Focus listeners removidos correctamente')
    }
  }
}

// Export de la instancia singleton
export const realtimeManager = RealtimeManager.getInstance()
