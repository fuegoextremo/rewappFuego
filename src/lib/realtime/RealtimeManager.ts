import { createClientBrowser } from '@/lib/supabase/client'
import type { QueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppDispatch } from '@/store'
import type { CouponRow } from '@/store/slices/authSlice'
// 🔔 NUEVO: Importar NotificationService de forma SEGURA
import NotificationService from '@/lib/services/notifications'
// 🎯 MIGRACIÓN: Imports estáticos para evitar problemas
import { updateStreakData, updateUserStats } from '@/store/slices/userDataSlice'
// 🫀 NEW: Connection Health Monitor
import { connectionHealthMonitor } from './ConnectionHealthMonitor'

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

  private static sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return data
    
    const sanitized = { ...data }
    
    // Ocultar información sensible
    if (sanitized.userId && typeof sanitized.userId === 'string') {
      sanitized.userId = sanitized.userId.substring(0, 8) + '...'
    }
    if (sanitized.user_id && typeof sanitized.user_id === 'string') {
      sanitized.user_id = sanitized.user_id.substring(0, 8) + '...'
    }
    
    return sanitized
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
    // Solo logear en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const entry = this.formatLogEntry('info', context, message, this.sanitizeData(data))
      console.log(`🔵 [${entry.timestamp}] [RealtimeManager::${entry.context}] ${entry.message}`, entry.data || '')
    }
  }

  static warn(context: string, message: string, data?: Record<string, unknown>) {
    const entry = this.formatLogEntry('warn', context, message, this.sanitizeData(data))
    console.warn(`🟡 [${entry.timestamp}] [RealtimeManager::${entry.context}] ${entry.message}`, entry.data || '')
  }

  static error(context: string, message: string, data?: Record<string, unknown>) {
    const entry = this.formatLogEntry('error', context, message, this.sanitizeData(data))
    console.error(`🔴 [${entry.timestamp}] [RealtimeManager::${entry.context}] ${entry.message}`, entry.data || '')
  }

  static debug(context: string, message: string, data?: Record<string, unknown>) {
    // Solo logear en desarrollo para evitar spam en producción
    if (process.env.NODE_ENV === 'development') {
      const entry = this.formatLogEntry('debug', context, message, data)
      console.log(`🔍 [${entry.timestamp}] [RealtimeManager::${entry.context}] ${entry.message}`, entry.data || '')
    }
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
        table: 'check_ins',
        filter: `user_id=eq.${userId}`
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
          currentCount: payload.new?.current_count,
          maxCount: payload.new?.max_count,
          fullPayload: payload.new
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
          
          // 🫀 Inicializar health monitor después de conexión exitosa
          connectionHealthMonitor.start({
            onSendHeartbeat: () => {
              // Enviar heartbeat via broadcast para verificar conectividad
              if (this.channel) {
                this.channel.send({
                  type: 'broadcast',
                  event: 'heartbeat_ping',
                  payload: { timestamp: Date.now() }
                })
              }
            },
            onReconnectNeeded: () => {
              console.log('🔄 Health monitor detectó conexión muerta - reconectando...')
              const currentUserId = this.currentUserId
              this.disconnect()
              if (currentUserId) {
                setTimeout(() => this.connect(currentUserId), 2000)
              }
            }
          })
          
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
    
    // 🫀 Detener health monitor al desconectar
    connectionHealthMonitor.stop()
    
    // 🚀 IMPORTANTE: NO hacer cleanup de Page Visibility aquí
    // ❌ this.cleanupPageVisibility() - Se mantiene activo para el singleton
    // 🔄 Solo reset el estado de pausa
    this.isPaused = false
  }

  // Handlers para eventos específicos
  private handleUserSpinsChange(payload: RealtimePayload) {
    // 🫀 Notificar health monitor que recibimos datos
    connectionHealthMonitor.notifyDataReceived()
    
    if (payload.new && payload.new.user_id === this.currentUserId) {
      const newSpins = payload.new.available_spins as number
      const oldSpins = (payload.old?.available_spins as number) || 0
      
      RealtimeLogger.info('user-spins', 'Cambio en spins detectado', { 
        oldSpins, 
        newSpins, 
        diff: newSpins - oldSpins,
        userId: this.currentUserId 
      })
      
      // ✅ MIGRACIÓN COMPLETA: Solo actualizar userDataSlice (fuente única de verdad)
      if (this.reduxDispatch) {
        import('@/store/slices/userDataSlice').then(({ updateUserStats }) => {
          this.reduxDispatch!(updateUserStats({ available_spins: newSpins }))
          RealtimeLogger.info('user-spins', 'userData store actualizado exitosamente', { newSpins })
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
    // 🫀 Notificar health monitor que recibimos datos
    connectionHealthMonitor.notifyDataReceived()
    
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
          loadRecentActivity
        }) => {
          // Incrementar visitas totales
          this.reduxDispatch!(incrementTotalCheckins())
          RealtimeLogger.info('check-ins', 'Incrementando total_checkins en Redux')
          
          // 🔄 NUEVO: Los giros se actualizan solo via user_spins (evita race condition)
          RealtimeLogger.debug('check-ins', 'Giros se actualizarán via evento user_spins')
          
          // 🔥 OPTIMIZADO: Recargar actividad reciente desde la DB (fuente de verdad)
          // Esto evita race conditions con prependRecentActivity
          if (this.currentUserId) {
            this.reduxDispatch!(loadRecentActivity(this.currentUserId))
            RealtimeLogger.info('check-ins', 'Recargando actividad reciente desde DB')
          }
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
    // 🫀 Notificar health monitor que recibimos datos
    connectionHealthMonitor.notifyDataReceived()
    
    if (payload.new && payload.new.user_id === this.currentUserId) {
      console.log('🔥 RealtimeManager: Streak payload completo:', payload.new)
      
      // ✅ MIGRACIÓN COMPLETA: Solo actualizar userDataSlice (fuente única de verdad)
      if (this.reduxDispatch) {
        const currentCount = payload.new?.current_count as number
        if (typeof currentCount === 'number' && currentCount >= 0) {
          console.log('🔄 Procesando cambio de streak:', { currentCount, maxCount: payload.new?.max_count })
          
          // Actualizar streakData completo (fuente única de verdad para current_count)
          // NOTA: last_check_in de streaks NO se usa, se obtiene de check_ins via loadUserStats
          const userDataStreakData = {
            current_count: currentCount,
            completed_count: (payload.new?.completed_count as number) || 0,
            is_just_completed: (payload.new?.is_just_completed as boolean) || false,
            expires_at: payload.new?.expires_at as string | null
          }
          
          try {
            this.reduxDispatch!(updateStreakData(userDataStreakData))
            console.log('✅ updateStreakData dispatch exitoso:', userDataStreakData)
          } catch (error) {
            console.error('❌ Error en updateStreakData:', error)
          }
          
          // Actualizar userStats: max_streak y recargar last_check_in desde check_ins
          const userStatsUpdate: Partial<{
            max_streak: number
          }> = {}
          
          // 🔥 LÓGICA max_streak: Usar max_count del payload (ya calculado en el servidor)
          const maxCount = (payload.new?.max_count as number)
          if (typeof maxCount === 'number' && maxCount >= 0) {
            userStatsUpdate.max_streak = maxCount
            console.log('🏆 max_streak actualizado vía realtime:', maxCount)
          }
          
          try {
            this.reduxDispatch!(updateUserStats(userStatsUpdate))
            console.log('✅ updateUserStats dispatch exitoso:', userStatsUpdate)
            
            // 📅 CORREGIDO: Recargar last_check_in desde check_ins (fuente real)
            // Esto asegura que last_check_in sea el dato correcto de la tabla check_ins
            if (this.currentUserId) {
              import('@/store/slices/userDataSlice').then(({ loadUserStats }) => {
                this.reduxDispatch!(loadUserStats(this.currentUserId!))
                console.log('🔄 Recargando userStats para obtener last_check_in real')
              })
            }
          } catch (error) {
            console.error('❌ Error en updateUserStats:', error)
          }
          
          console.log('✅ MIGRACIÓN: userData actualizado completo');
        } else {
          console.warn('⚠️ currentCount inválido:', currentCount)
        }
      } else {
        console.error('❌ reduxDispatch no disponible')
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
    // 🫀 Notificar health monitor que recibimos datos
    connectionHealthMonitor.notifyDataReceived()
    
    if (payload.new && payload.new.user_id === this.currentUserId) {
      const newCoupon = payload.new as Record<string, unknown>
      const oldCoupon = (payload.old || {}) as Record<string, unknown>

      // Evento explícito para cierre automático del RedeemSheet al redimirse un cupón.
      if (
        payload.eventType === 'UPDATE' &&
        newCoupon?.id &&
        newCoupon?.is_redeemed === true &&
        oldCoupon?.is_redeemed !== true
      ) {
        window.dispatchEvent(
          new CustomEvent('coupon-redeemed', {
            detail: {
              couponId: newCoupon.id,
              source: newCoupon.source || null,
            },
          })
        )
      }

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
      console.log('⚠️ Page Visibility DESHABILITADO temporalmente para evitar pausas/resumenes')
      // if (document.hidden) {
      //   console.log('🌙 PESTAÑA OCULTA - RealtimeManager pausando...')
      //   this.pause()
      // } else {
      //   console.log('📱 PESTAÑA VISIBLE - RealtimeManager resumiendo...')
      //   this.resume()
      // }
    }
    
    // 🎯 Window Focus Listeners - TEMPORALMENTE DESHABILITADOS para debugging
    this.windowBlurListener = () => {
      console.log('⚠️ windowBlur DESHABILITADO temporalmente para evitar pausas')
      // Solo pausar si la ventana realmente está inactiva por más tiempo
      // console.log('🌙 VENTANA SIN FOCO - Programando pausa en 2s...')
      // setTimeout(() => {
      //   if (document.visibilityState === 'hidden' || !document.hasFocus()) {
      //     console.log('🔴 Pausando realtime por inactividad confirmada')
      //     this.pause()
      //   } else {
      //     console.log('✅ Ventana volvió al foco - no pausar')
      //   }
      // }, 2000) // Delay de 2 segundos para evitar pausas innecesarias
    }
    
    this.windowFocusListener = () => {
      console.log('⚠️ windowFocus DESHABILITADO temporalmente para evitar resumenes')
      // console.log('📱 VENTANA CON FOCO - RealtimeManager resumiendo...')
      // this.resume()
    }
    
    // Configurar heartbeat monitoring en lugar de Page Visibility
    // TODO: Implementar sistema de heartbeat después de resolver problemas de sintaxis
    console.log('🫀 Heartbeat monitoring inicializado (simplificado)')
  }

  // 🎯 TEMPORALMENTE DESHABILITADO - Page Visibility API 
  // TODO: Re-implementar con heartbeat inteligente después de resolver re-renders
  private setupPageVisibilityHandlers(): void {
    console.log('⚠️ Page Visibility API DESHABILITADO temporalmente - usando heartbeat en su lugar')
    RealtimeLogger.info('page-visibility', 'Page Visibility API deshabilitado, heartbeat monitoring activo')
  }  private pause() {
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
