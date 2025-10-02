/**
 * ConnectionHealthMonitor - Sistema de heartbeat y detección de conexión muerta
 * 
 * Responsabilidades:
 * - Monitorear salud de conexión realtime
 * - Detectar inactividad de datos
 * - Enviar heartbeats periódicos
 * - Solicitar reconexión cuando sea necesario
 */

interface ConnectionHealthCallbacks {
  onReconnectNeeded?: () => void
  onSendHeartbeat?: () => void
}

class ConnectionHealthMonitor {
  private lastDataReceived: number = Date.now()
  private heartbeatInterval: number | null = null
  private healthCheckInterval: number | null = null
  private callbacks: ConnectionHealthCallbacks = {}
  private isMonitoring: boolean = false
  
  // Configuración
  private readonly HEARTBEAT_INTERVAL = 30000 // 30s
  private readonly CONNECTION_TIMEOUT = 90000 // 90s sin datos = reconectar
  private readonly HEALTH_CHECK_INTERVAL = 15000 // 15s revisar salud
  
  /**
   * Inicializar monitoreo de conexión
   */
  start(callbacks: ConnectionHealthCallbacks): void {
    if (this.isMonitoring) {
      console.log('🫀 ConnectionHealthMonitor ya está corriendo')
      return
    }
    
    this.callbacks = callbacks
    this.isMonitoring = true
    this.lastDataReceived = Date.now()
    
    console.log('🫀 Iniciando ConnectionHealthMonitor', {
      heartbeatInterval: this.HEARTBEAT_INTERVAL,
      connectionTimeout: this.CONNECTION_TIMEOUT,
      healthCheckInterval: this.HEALTH_CHECK_INTERVAL
    })
    
    this.startHeartbeat()
    this.startHealthCheck()
  }
  
  /**
   * Detener monitoreo
   */
  stop(): void {
    if (!this.isMonitoring) return
    
    console.log('🫀 Deteniendo ConnectionHealthMonitor')
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    
    this.isMonitoring = false
    this.callbacks = {}
  }
  
  /**
   * Notificar que se recibieron datos (llamar desde RealtimeManager)
   */
  notifyDataReceived(): void {
    this.lastDataReceived = Date.now()
  }
  
  /**
   * Verificar si la conexión está saludable
   */
  isHealthy(): boolean {
    const timeSinceLastData = Date.now() - this.lastDataReceived
    return timeSinceLastData < this.CONNECTION_TIMEOUT
  }
  
  /**
   * Obtener estadísticas de conexión
   */
  getStats() {
    const timeSinceLastData = Date.now() - this.lastDataReceived
    return {
      isMonitoring: this.isMonitoring,
      isHealthy: this.isHealthy(),
      lastDataReceived: new Date(this.lastDataReceived).toISOString(),
      timeSinceLastData,
      connectionTimeout: this.CONNECTION_TIMEOUT
    }
  }
  
  // Métodos privados
  
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.callbacks.onSendHeartbeat) {
        this.callbacks.onSendHeartbeat()
        console.log('💓 Heartbeat enviado', {
          timeSinceLastData: Date.now() - this.lastDataReceived
        })
      }
    }, this.HEARTBEAT_INTERVAL)
  }
  
  private startHealthCheck(): void {
    this.healthCheckInterval = window.setInterval(() => {
      const timeSinceLastData = Date.now() - this.lastDataReceived
      
      if (timeSinceLastData > this.CONNECTION_TIMEOUT) {
        console.warn('⚠️ Conexión parece muerta', {
          timeSinceLastData,
          threshold: this.CONNECTION_TIMEOUT,
          willReconnect: true
        })
        
        if (this.callbacks.onReconnectNeeded) {
          this.callbacks.onReconnectNeeded()
        }
      } else {
        console.log('✅ Conexión saludable', {
          timeSinceLastData,
          threshold: this.CONNECTION_TIMEOUT
        })
      }
    }, this.HEALTH_CHECK_INTERVAL)
  }
}

// Export singleton
export const connectionHealthMonitor = new ConnectionHealthMonitor()