/**
 * 🔔 NOTIFICATION SERVICE - SISTEMA UNIFICADO DE NOTIFICACIONES
 * 
 * FASE 1: Solo Toasts (SEGURO - No rompe nada existente)
 * FASE 2: WhatsApp preparado pero APAGADO
 * 
 * Integración: Compatible 100% con sistema actual
 */

import { toast } from '@/hooks/use-toast'

export interface NotificationData {
  userId?: string
  title?: string
  message: string
  duration?: number
  type?: 'success' | 'warning' | 'error' | 'info'
  metadata?: Record<string, unknown>
}

export interface WhatsAppData {
  userId: string
  template: string
  parameters: Record<string, string>
  phone?: string
}

/**
 * 🎯 NOTIFICATION SERVICE - Unifica todas las notificaciones
 */
export class NotificationService {
  
  // 🔔 TOAST NOTIFICATIONS (ACTIVO)
  
  /**
   * Mostrar notificación de éxito
   */
  static showSuccess(message: string, duration = 4000, title = "✅ Éxito") {
    return toast({
      title,
      description: message,
      duration,
    })
  }

  /**
   * Mostrar notificación de advertencia
   */
  static showWarning(message: string, duration = 4000, title = "⚠️ Atención") {
    return toast({
      title,
      description: message,
      duration,
      variant: "destructive"
    })
  }

  /**
   * Mostrar notificación de error
   */
  static showError(message: string, duration = 6000, title = "❌ Error") {
    return toast({
      title,
      description: message,
      duration,
      variant: "destructive"
    })
  }

  /**
   * Mostrar notificación informativa
   */
  static showInfo(message: string, duration = 4000, title = "ℹ️ Información") {
    return toast({
      title,
      description: message,
      duration,
    })
  }

  // 📲 WHATSAPP NOTIFICATIONS (BASE PREPARADA - APAGADA)
  
  /**
   * Enviar notificación WhatsApp
   * NOTA: Preparado pero DESACTIVADO en Fase 1
   */
  static async sendWhatsApp(data: WhatsAppData): Promise<{ success: boolean; message: string }> {
    // 🚫 FASE 1: WhatsApp APAGADO - Solo logging para preparación
    console.log('🔮 WhatsApp notification preparado (APAGADO):', {
      userId: data.userId,
      template: data.template,
      parameters: data.parameters,
      timestamp: new Date().toISOString()
    })

    // TODO FASE 2: Implementar envío real WhatsApp
    return Promise.resolve({
      success: true,
      message: 'WhatsApp notification preparado (actualmente desactivado)'
    })
  }

  // 🎭 NOTIFICACIONES ESPECÍFICAS DEL DOMINIO
  
  /**
   * Notificación: Check-in exitoso
   */
  static notifyCheckinSuccess(spins: number, onComplete?: () => void) {
    const message = spins === 1 
      ? "¡Check-in exitoso! +1 giro"
      : `¡Check-in exitoso! +${spins} giros`

    this.showSuccess(message, 4000, "🎯 Check-in")
    
    // Ejecutar callback al mismo tiempo que aparece el toast
    if (onComplete) {
      onComplete()
    }
  }

  /**
   * Notificación: Cupón obtenido por racha
   */
  static notifyCouponByStreak(threshold: number, prizeName?: string) {
    const message = prizeName 
      ? `🎫 ¡Obtuviste "${prizeName}" por completar ${threshold} visitas!`
      : `🎫 ¡Cupón obtenido por completar ${threshold} visitas!`

    this.showSuccess(message, 5000, "🏆 Premio por Visitas")
  }

  /**
   * Notificación: Racha completada
   */
  static notifyStreakCompleted(completedCount: number) {
    const message = completedCount === 1
      ? "🏆 ¡Felicidades! Completaste tu primera racha"
      : `🏆 ¡Felicidades! Completaste tu racha (${completedCount} totales)`

    this.showSuccess(message, 6000, "🔥 Racha Completada")
  }

  /**
   * Notificación: Cupón manual otorgado por admin
   */
  static notifyManualCoupon(prizeName: string) {
    const message = `🎁 ¡Recibiste un premio: ${prizeName}!`
    this.showSuccess(message, 5000, "🎁 Regalo del Admin")
  }

  /**
   * Notificación: Cupón ganado en la ruleta
   * Con delay de 5.5s para sincronizar con animación RIVE
   */
  static notifyRoulettePrize(prizeName: string, onComplete?: () => void) {
    const RULETA_ANIMATION_DELAY = 5500 // 5.5s para coincidir con animación RIVE
    
    console.log('🎲 RealtimeManager: ⏳ Delay de notificación ruleta iniciado - esperando', RULETA_ANIMATION_DELAY, 'ms')
    
    setTimeout(() => {
      const message = `🎲 ¡Ganaste en la ruleta: ${prizeName}!`
      this.showSuccess(message, 5000, "🎲 Premio de Ruleta")
      console.log('🎲 RealtimeManager: ✅ Toast cupón por RULETA mostrado (con delay)')
      
      // Ejecutar callback al mismo tiempo que aparece el toast
      if (onComplete) {
        onComplete()
      }
    }, RULETA_ANIMATION_DELAY)
  }

  /**
   * Notificación: Giros otorgados por admin
   */
  static notifyManualSpins(spins: number) {
    const message = spins === 1
      ? "🎯 +1 giro otorgado por el administrador"
      : `🎯 +${spins} giros otorgados por el administrador`

    this.showSuccess(message, 4000, "🎯 Giros Extra")
  }

  // 🔧 UTILIDADES
  
  /**
   * Verificar si los toasts están disponibles
   */
  static isToastAvailable(): boolean {
    return typeof toast === 'function'
  }

  /**
   * Log de notificación para debugging
   */
  private static logNotification(type: string, data: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔔 Notification [${type}]:`, data)
    }
  }
}

// 🎯 EXPORT PRINCIPAL
export default NotificationService
