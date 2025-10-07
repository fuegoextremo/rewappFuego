"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SETTINGS } from "@/constants/default-settings";
import { revalidatePath } from "next/cache";

export interface AnalyticsData {
  kpis: {
    estimatedRevenue: number;
    activeUsers: number;
    engagementRate: number;
    conversionRate: number;
    revenueGrowth: number;
    userGrowth: number;
  };
  period: {
    checkins: number[];
    newUsers: number[];
    couponsGenerated: number[];
    couponsRedeemed: number[];
    revenue: number[];
    dates: string[];
  };
  branches: {
    id: string;
    name: string;
    checkins: number;
    revenue: number;
    users: number;
    conversionRate: number;
  }[];
  topMetrics: {
    topBranch: { name: string; checkins: number };
    topPrize: { name: string; redeemed: number };
    peakHour: { hour: number; checkins: number };
    bestDay: { date: string; checkins: number };
  };
  hourlyActivity: {
    hour: number;
    activity: number;
    label: string;
  }[];
  totals: {
    totalCheckins: number;
    totalCouponsGenerated: number;
    totalCouponsRedeemed: number;
  };
}

// Tipo para métricas de negocio dinámicas
export interface BusinessMetrics {
  CHECK_IN_VALUE: number;
  COUPON_AVG_VALUE: number;
  USER_ACQUISITION_COST: number;
  SPIN_COST: number;
  RETENTION_MULTIPLIER: number;
  PREMIUM_BRANCH_MULTIPLIER: number;
}

/**
 * Obtener métricas de negocio desde system_settings o usar defaults
 */
async function getBusinessMetrics(): Promise<BusinessMetrics> {
  try {
    const supabase = createAdminClient();
    
    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'analytics_checkin_value',
        'analytics_coupon_avg_value', 
        'analytics_user_acquisition_cost',
        'analytics_spin_cost',
        'analytics_retention_multiplier',
        'analytics_premium_branch_multiplier'
      ]);

    const getSettingValue = (key: string, defaultValue: string): number => {
      const setting = settings?.find(s => s.key === key);
      return parseFloat(setting?.value || defaultValue);
    };

    return {
      CHECK_IN_VALUE: getSettingValue('analytics_checkin_value', DEFAULT_SETTINGS.analytics_checkin_value || '50'),
      COUPON_AVG_VALUE: getSettingValue('analytics_coupon_avg_value', DEFAULT_SETTINGS.analytics_coupon_avg_value || '150'),
      USER_ACQUISITION_COST: getSettingValue('analytics_user_acquisition_cost', DEFAULT_SETTINGS.analytics_user_acquisition_cost || '200'),
      SPIN_COST: getSettingValue('analytics_spin_cost', DEFAULT_SETTINGS.analytics_spin_cost || '10'),
      RETENTION_MULTIPLIER: getSettingValue('analytics_retention_multiplier', DEFAULT_SETTINGS.analytics_retention_multiplier || '1.5'),
      PREMIUM_BRANCH_MULTIPLIER: getSettingValue('analytics_premium_branch_multiplier', DEFAULT_SETTINGS.analytics_premium_branch_multiplier || '1.2'),
    };
  } catch (error) {
    console.error('Error loading business metrics, using defaults:', error);
    // Fallback a valores hardcodeados si falla la consulta
    return {
      CHECK_IN_VALUE: 50,
      COUPON_AVG_VALUE: 150,
      USER_ACQUISITION_COST: 200,
      SPIN_COST: 10,
      RETENTION_MULTIPLIER: 1.5,
      PREMIUM_BRANCH_MULTIPLIER: 1.2,
    };
  }
}

/**
 * Obtener datos principales de analytics
 */
export async function getAnalyticsData(days: number = 30): Promise<{ 
  success: boolean; 
  data?: AnalyticsData; 
  error?: string;
}> {
  try {
    const supabase = createAdminClient();
    
    // 🔥 OBTENER MÉTRICAS DINÁMICAS
    const businessMetrics = await getBusinessMetrics();
    
    // Calcular fechas - INCLUIR TODO EL DÍA ACTUAL
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Hasta el final del día actual
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Desde el inicio del día inicial
    
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Consultas paralelas optimizadas
    const [
      periodStats,
      previousPeriodStats,
      branchPerformance,
      topMetricsData
    ] = await Promise.all([
      getPeriodStats(supabase, startDate, endDate, businessMetrics),
      getPeriodStats(supabase, previousStartDate, startDate, businessMetrics), // Para comparación
      getBranchPerformance(supabase, startDate, endDate, businessMetrics),
      getTopMetrics(supabase, startDate, endDate)
    ]);

    // Calcular KPIs
    const currentRevenue = periodStats.totalCheckins * businessMetrics.CHECK_IN_VALUE +
                           periodStats.totalCouponsRedeemed * businessMetrics.COUPON_AVG_VALUE;
    
    const previousRevenue = previousPeriodStats.totalCheckins * businessMetrics.CHECK_IN_VALUE +
                            previousPeriodStats.totalCouponsRedeemed * businessMetrics.COUPON_AVG_VALUE;

    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const userGrowth = previousPeriodStats.totalNewUsers > 0
      ? ((periodStats.totalNewUsers - previousPeriodStats.totalNewUsers) / previousPeriodStats.totalNewUsers) * 100
      : 0;

    // 🔥 OBTENER DATOS REALES DE ACTIVIDAD POR HORA
    const hourlyActivityData = await getHourlyActivity(supabase, startDate, endDate);

    const data: AnalyticsData = {
      kpis: {
        estimatedRevenue: currentRevenue,
        activeUsers: periodStats.activeUsers,
        engagementRate: periodStats.engagementRate,
        conversionRate: periodStats.conversionRate,
        revenueGrowth,
        userGrowth,
      },
      period: periodStats.dailyData,
      branches: branchPerformance,
      topMetrics: topMetricsData,
      hourlyActivity: hourlyActivityData,
      totals: {
        totalCheckins: periodStats.totalCheckins,
        totalCouponsGenerated: periodStats.totalCouponsGenerated,
        totalCouponsRedeemed: periodStats.totalCouponsRedeemed,
      },
    };

    return { success: true, data };
  } catch (error) {
    console.error('Error in getAnalyticsData:', error);
    return {
      success: false,
      error: 'Error al obtener datos de analytics'
    };
  }
}

/**
 * Obtener actividad real por hora del día
 */
async function getHourlyActivity(
  supabase: ReturnType<typeof createAdminClient>, 
  startDate: Date, 
  endDate: Date
) {
  // Obtener todos los check-ins del período
  const { data: checkinsData } = await supabase
    .from('check_ins')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Contar actividad por cada hora del día (0-23)
  const hourCounts = new Map<number, number>();
  
  // Inicializar todas las horas en 0
  for (let hour = 0; hour < 24; hour++) {
    hourCounts.set(hour, 0);
  }

  // Contar check-ins por hora
  checkinsData?.forEach(item => {
    if (item.created_at) {
      const hour = new Date(item.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
  });

  // Convertir a formato para el componente
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    activity: hourCounts.get(hour) || 0,
    label: `${hour.toString().padStart(2, '0')}:00`
  }));
}

/**
 * Obtener estadísticas de un período
 */
async function getPeriodStats(
  supabase: ReturnType<typeof createAdminClient>, 
  startDate: Date, 
  endDate: Date,
  businessMetrics: BusinessMetrics
) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const [
    checkinsData,
    usersData,
    couponsData,
    redeemedCouponsData
  ] = await Promise.all([
    supabase
      .from('check_ins')
      .select('created_at, user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    supabase
      .from('coupons')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    supabase
      .from('coupons')
      .select('redeemed_at')
      .eq('is_redeemed', true)
      .gte('redeemed_at', startDate.toISOString())
      .lte('redeemed_at', endDate.toISOString())
  ]);

  // Agrupar por día
  const dailyCheckins = new Map<string, number>();
  const dailyUsers = new Map<string, number>();
  const dailyCoupons = new Map<string, number>();
  const dailyRedeemed = new Map<string, number>();

  // Procesar check-ins
  checkinsData.data?.forEach(item => {
    if (item.created_at) {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      dailyCheckins.set(date, (dailyCheckins.get(date) || 0) + 1);
    }
  });

  // Procesar usuarios
  usersData.data?.forEach(item => {
    if (item.created_at) {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      dailyUsers.set(date, (dailyUsers.get(date) || 0) + 1);
    }
  });

  // Procesar cupones
  couponsData.data?.forEach(item => {
    if (item.created_at) {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      dailyCoupons.set(date, (dailyCoupons.get(date) || 0) + 1);
    }
  });

  // Procesar cupones canjeados
  redeemedCouponsData.data?.forEach(item => {
    if (item.redeemed_at) {
      const date = new Date(item.redeemed_at).toISOString().split('T')[0];
      dailyRedeemed.set(date, (dailyRedeemed.get(date) || 0) + 1);
    }
  });

  // Crear arrays para gráficas
  const dates: string[] = [];
  const checkins: number[] = [];
  const newUsers: number[] = [];
  const couponsGenerated: number[] = [];
  const couponsRedeemed: number[] = [];
  const revenue: number[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayCheckins = dailyCheckins.get(dateStr) || 0;
    const dayUsers = dailyUsers.get(dateStr) || 0;
    const dayCoupons = dailyCoupons.get(dateStr) || 0;
    const dayRedeemed = dailyRedeemed.get(dateStr) || 0;
    const dayRevenue = dayCheckins * businessMetrics.CHECK_IN_VALUE + 
                      dayRedeemed * businessMetrics.COUPON_AVG_VALUE;

    dates.push(date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
    checkins.push(dayCheckins);
    newUsers.push(dayUsers);
    couponsGenerated.push(dayCoupons);
    couponsRedeemed.push(dayRedeemed);
    revenue.push(dayRevenue);
  }

  // Calcular métricas
  const totalCheckins = checkinsData.data?.length || 0;
  const totalNewUsers = usersData.data?.length || 0;
  const totalCouponsGenerated = couponsData.data?.length || 0;
  const totalCouponsRedeemed = redeemedCouponsData.data?.length || 0;
  
  // Usuarios únicos activos
  const uniqueActiveUsers = new Set(checkinsData.data?.map(c => c.user_id)).size;
  
  // Métricas calculadas
  const conversionRate = totalCouponsGenerated > 0 
    ? (totalCouponsRedeemed / totalCouponsGenerated) * 100 
    : 0;
  
  const engagementRate = totalNewUsers > 0 
    ? (uniqueActiveUsers / totalNewUsers) * 100 
    : 0;

  return {
    totalCheckins,
    totalNewUsers,
    totalCouponsGenerated,
    totalCouponsRedeemed,
    activeUsers: uniqueActiveUsers,
    conversionRate,
    engagementRate,
    dailyData: {
      dates,
      checkins,
      newUsers,
      couponsGenerated,
      couponsRedeemed,
      revenue,
    },
  };
}

/**
 * Obtener performance por sucursal
 */
async function getBranchPerformance(
  supabase: ReturnType<typeof createAdminClient>,
  startDate: Date,
  endDate: Date,
  businessMetrics: BusinessMetrics
) {
  // 🔥 CORREGIDO: Usar LEFT JOIN para incluir todas las sucursales
  const { data: branchStats, error } = await supabase
    .from('branches')
    .select(`
      id,
      name,
      check_ins(
        id,
        created_at,
        user_id
      )
    `)
    .eq('is_active', true)
    .gte('check_ins.created_at', startDate.toISOString())
    .lte('check_ins.created_at', endDate.toISOString());

  if (error || !branchStats) return [];

  return branchStats.map(branch => {
    // Filtrar check-ins del período (por si algunos se escapan del filtro)
    const periodCheckins = (branch.check_ins || []).filter(c => 
      c.created_at && 
      new Date(c.created_at) >= startDate && 
      new Date(c.created_at) <= endDate
    );
    
    const uniqueUsers = new Set(periodCheckins.map(c => c.user_id)).size;
    const revenue = periodCheckins.length * businessMetrics.CHECK_IN_VALUE;
    const conversionRate = uniqueUsers > 0 ? (periodCheckins.length / uniqueUsers) : 0;

    return {
      id: branch.id,
      name: branch.name,
      checkins: periodCheckins.length,
      revenue,
      users: uniqueUsers,
      conversionRate: conversionRate * 100,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

/**
 * Obtener métricas destacadas
 */
async function getTopMetrics(
  supabase: ReturnType<typeof createAdminClient>,
  startDate: Date,
  endDate: Date
) {
  const [topBranchData, topPrizeData, peakHourData] = await Promise.all([
    // Sucursal con más check-ins
    supabase
      .from('check_ins')
      .select(`
        branches(name),
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    // Premio más canjeado
    supabase
      .from('coupons')
      .select(`
        prizes(name),
        redeemed_at
      `)
      .eq('is_redeemed', true)
      .gte('redeemed_at', startDate.toISOString())
      .lte('redeemed_at', endDate.toISOString()),

    // Datos para hora pico
    supabase
      .from('check_ins')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
  ]);

  // Procesar top branch
  const branchCounts = new Map<string, number>();
  topBranchData.data?.forEach(item => {
    if (item.branches?.name) {
      branchCounts.set(item.branches.name, (branchCounts.get(item.branches.name) || 0) + 1);
    }
  });
  const topBranch = Array.from(branchCounts.entries())
    .sort(([,a], [,b]) => b - a)[0] || ['Sin datos', 0];

  // Procesar top prize
  const prizeCounts = new Map<string, number>();
  topPrizeData.data?.forEach(item => {
    if (item.prizes?.name) {
      prizeCounts.set(item.prizes.name, (prizeCounts.get(item.prizes.name) || 0) + 1);
    }
  });
  const topPrize = Array.from(prizeCounts.entries())
    .sort(([,a], [,b]) => b - a)[0] || ['Sin datos', 0];

  // Procesar hora pico
  const hourCounts = new Map<number, number>();
  peakHourData.data?.forEach(item => {
    if (item.created_at) {
      const hour = new Date(item.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }
  });
  const peakHour = Array.from(hourCounts.entries())
    .sort(([,a], [,b]) => b - a)[0] || [12, 0];

  // Mejor día
  const dayCounts = new Map<string, number>();
  topBranchData.data?.forEach(item => {
    if (item.created_at) {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      dayCounts.set(date, (dayCounts.get(date) || 0) + 1);
    }
  });
  const bestDay = Array.from(dayCounts.entries())
    .sort(([,a], [,b]) => b - a)[0] || ['Sin datos', 0];

  return {
    topBranch: { name: topBranch[0], checkins: topBranch[1] },
    topPrize: { name: topPrize[0], redeemed: topPrize[1] },
    peakHour: { hour: peakHour[0], checkins: peakHour[1] },
    bestDay: { date: bestDay[0], checkins: bestDay[1] },
  };
}

/**
 * Forzar actualización de datos (invalidar cache)
 */
export async function refreshAnalytics() {
  revalidatePath('/superadmin/analytics');
  return { success: true };
}