// Importar función para obtener configuraciones dinámicas
import { createClientServer } from '@/lib/supabase/server';

// Métricas de negocio - MIGRADAS A CONFIGURACIONES DINÁMICAS
// Ahora se obtienen de system_settings, con fallbacks hardcodeados
export const BUSINESS_METRICS = {
  // Valores monetarios (en pesos mexicanos) - FALLBACKS
  CHECK_IN_VALUE: 50, // Valor estimado por check-in
  COUPON_AVG_VALUE: 150, // Valor promedio de cupón canjeado
  USER_ACQUISITION_COST: 200, // Costo de adquirir un nuevo usuario
  SPIN_COST: 10, // Costo por giro de ruleta
  
  // Metas de negocio
  DAILY_CHECKINS_TARGET: 100,
  MONTHLY_USERS_TARGET: 500,
  CONVERSION_RATE_TARGET: 0.25, // 25%
  
  // Factores de cálculo - FALLBACKS
  RETENTION_MULTIPLIER: 1.5, // Usuario retenido vale 1.5x más
  PREMIUM_BRANCH_MULTIPLIER: 1.2, // Sucursales premium valen 20% más
};

export type BusinessMetrics = {
  CHECK_IN_VALUE: number;
  COUPON_AVG_VALUE: number;
  USER_ACQUISITION_COST: number;
  SPIN_COST: number;
  DAILY_CHECKINS_TARGET: number;
  MONTHLY_USERS_TARGET: number;
  CONVERSION_RATE_TARGET: number;
  RETENTION_MULTIPLIER: number;
  PREMIUM_BRANCH_MULTIPLIER: number;
};

/**
 * Obtener métricas dinámicas desde la base de datos
 */
export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  try {
    const supabase = createClientServer();
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'analytics')
      .eq('is_active', true);

    if (error || !data) {
      console.warn('No se pudieron obtener configuraciones de analytics, usando fallbacks');
      return BUSINESS_METRICS;
    }

    // Convertir configuraciones a objeto
    const settings = data.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // Retornar métricas con valores dinámicos
    return {
      CHECK_IN_VALUE: parseInt(settings.analytics_checkin_value) || BUSINESS_METRICS.CHECK_IN_VALUE,
      COUPON_AVG_VALUE: parseInt(settings.analytics_coupon_avg_value) || BUSINESS_METRICS.COUPON_AVG_VALUE,
      USER_ACQUISITION_COST: parseInt(settings.analytics_user_acquisition_cost) || BUSINESS_METRICS.USER_ACQUISITION_COST,
      SPIN_COST: parseInt(settings.analytics_spin_cost) || BUSINESS_METRICS.SPIN_COST,
      RETENTION_MULTIPLIER: parseFloat(settings.analytics_retention_multiplier) || BUSINESS_METRICS.RETENTION_MULTIPLIER,
      PREMIUM_BRANCH_MULTIPLIER: parseFloat(settings.analytics_premium_branch_multiplier) || BUSINESS_METRICS.PREMIUM_BRANCH_MULTIPLIER,
      
      // Metas (no configurables por ahora)
      DAILY_CHECKINS_TARGET: BUSINESS_METRICS.DAILY_CHECKINS_TARGET,
      MONTHLY_USERS_TARGET: BUSINESS_METRICS.MONTHLY_USERS_TARGET,
      CONVERSION_RATE_TARGET: BUSINESS_METRICS.CONVERSION_RATE_TARGET,
    };
  } catch (error) {
    console.error('Error obteniendo business metrics:', error);
    return BUSINESS_METRICS;
  }
}