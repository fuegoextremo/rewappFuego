"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// ============================================
// HELPERS DE ZONA HORARIA - MEXICO (UTC-6)
// ============================================
const MEXICO_TZ = 'America/Mexico_City';

/**
 * Obtiene la fecha actual en zona horaria de México
 */
function getMexicoNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: MEXICO_TZ }));
}

/**
 * Convierte una fecha UTC a fecha en México (para agrupar por día)
 */
function toMexicoDate(utcDateString: string): string {
  const date = new Date(utcDateString);
  return date.toLocaleDateString('en-US', { timeZone: MEXICO_TZ });
}

/**
 * Obtiene medianoche de hoy en México, convertido a UTC para queries
 */
function getMexicoMidnightUTC(): Date {
  const mexicoNow = getMexicoNow();
  mexicoNow.setHours(0, 0, 0, 0);
  // Convertir de vuelta a UTC sumando el offset de México (+6 horas)
  return new Date(mexicoNow.getTime() + (6 * 60 * 60 * 1000));
}

/**
 * Obtiene el inicio de un día específico en México, convertido a UTC
 */
function getMexicoDayStartUTC(date: Date): Date {
  const mexicoDate = new Date(date.toLocaleString('en-US', { timeZone: MEXICO_TZ }));
  mexicoDate.setHours(0, 0, 0, 0);
  return new Date(mexicoDate.getTime() + (6 * 60 * 60 * 1000));
}

/**
 * Formatea una fecha para mostrar en la UI (en zona México)
 */
function formatMexicoDate(date: Date): string {
  return date.toLocaleDateString('es-MX', { 
    timeZone: MEXICO_TZ,
    month: 'short', 
    day: 'numeric' 
  });
}

export interface DashboardStats {
  today: {
    checkins: number;
    newUsers: number;
    couponsWon: number;
    couponsRedeemed: number;
  };
  period: {
    checkins: number[];
    newUsers: number[];
    couponsWon: number[];
    couponsRedeemed: number[];
    dates: string[];
  };
  topClients: {
    period: TopClient[];
    allTime: TopClient[];
  };
}

export interface TopClient {
  id: string;
  name: string;
  email: string;
  checkins: number;
  coupons: number;
}

// Obtener estadísticas del dashboard (OPTIMIZADO)
export async function getDashboardStats(days: number = 7): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const supabase = createAdminClient();
    
    // Calcular fechas usando zona horaria de México
    const mexicoNow = getMexicoNow();
    const endDate = new Date(mexicoNow);
    const startDate = new Date(mexicoNow);
    startDate.setDate(endDate.getDate() - days);
    
    // Hoy en México (medianoche México convertida a UTC para queries)
    const todayMidnightUTC = getMexicoMidnightUTC();
    const tomorrowMidnightUTC = new Date(todayMidnightUTC.getTime() + (24 * 60 * 60 * 1000));

    // Optimizar consultas de hoy usando Promise.all con consultas más simples
    const [todayStats, periodData, topClientsPeriod, topClientsAllTime] = await Promise.all([
      // Estadísticas de hoy en una sola consulta por tabla
      Promise.all([
        supabase.from('check_ins').select('id', { count: 'exact', head: true })
          .gte('created_at', todayMidnightUTC.toISOString())
          .lt('created_at', tomorrowMidnightUTC.toISOString()),
        
        supabase.from('user_profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', todayMidnightUTC.toISOString())
          .lt('created_at', tomorrowMidnightUTC.toISOString()),
        
        supabase.from('coupons').select('id', { count: 'exact', head: true })
          .gte('created_at', todayMidnightUTC.toISOString())
          .lt('created_at', tomorrowMidnightUTC.toISOString()),

        supabase.from('coupons').select('id', { count: 'exact', head: true })
          .eq('is_redeemed', true)
          .gte('redeemed_at', todayMidnightUTC.toISOString())
          .lt('redeemed_at', tomorrowMidnightUTC.toISOString())
      ]),
      
      // Datos del período para gráficas
      getPeriodData(supabase, startDate, endDate),

      // Top clientes del período
      getTopClients(supabase, startDate, endDate),

      // Top clientes de todos los tiempos
      getTopClients(supabase)
    ]);

    const stats: DashboardStats = {
      today: {
        checkins: todayStats[0].count || 0,
        newUsers: todayStats[1].count || 0,
        couponsWon: todayStats[2].count || 0,
        couponsRedeemed: todayStats[3].count || 0,
      },
      period: periodData,
      topClients: {
        period: topClientsPeriod,
        allTime: topClientsAllTime,
      },
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return {
      success: false,
      error: 'Error al obtener estadísticas del dashboard'
    };
  }
}

// Obtener datos del período para las gráficas (OPTIMIZADO - Zona horaria México)
async function getPeriodData(supabase: ReturnType<typeof createAdminClient>, startDate: Date, endDate: Date) {
  // Calcular días incluyendo tanto inicio como fin (+1)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Convertir fechas a UTC para queries (considerando zona México)
  const startUTC = getMexicoDayStartUTC(startDate);
  const endUTC = getMexicoDayStartUTC(endDate);
  endUTC.setDate(endUTC.getDate() + 1); // Incluir todo el último día
  
  // Hacer todas las consultas en paralelo una sola vez
  const [checkinsData, usersData, couponsData, redeemedCouponsData] = await Promise.all([
    // Todos los check-ins del período
    supabase
      .from('check_ins')
      .select('created_at')
      .gte('created_at', startUTC.toISOString())
      .lt('created_at', endUTC.toISOString()),

    // Todos los usuarios nuevos del período
    supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', startUTC.toISOString())
      .lt('created_at', endUTC.toISOString()),

    // Todos los cupones ganados del período
    supabase
      .from('coupons')
      .select('created_at')
      .gte('created_at', startUTC.toISOString())
      .lt('created_at', endUTC.toISOString()),

    // Todos los cupones canjeados del período
    supabase
      .from('coupons')
      .select('redeemed_at')
      .eq('is_redeemed', true)
      .gte('redeemed_at', startUTC.toISOString())
      .lt('redeemed_at', endUTC.toISOString())
  ]);

  // Inicializar arrays para cada día
  const dates: string[] = [];
  const checkins: number[] = [];
  const newUsers: number[] = [];
  const couponsWon: number[] = [];
  const couponsRedeemed: number[] = [];

  // Crear mapas para contar por día (usando zona horaria México)
  const checkinsByDay = new Map<string, number>();
  const usersByDay = new Map<string, number>();
  const couponsByDay = new Map<string, number>();
  const redeemedByDay = new Map<string, number>();

  // Procesar check-ins (agrupar por día en zona México)
  checkinsData.data?.forEach(item => {
    if (item.created_at) {
      const day = toMexicoDate(item.created_at);
      checkinsByDay.set(day, (checkinsByDay.get(day) || 0) + 1);
    }
  });

  // Procesar usuarios (agrupar por día en zona México)
  usersData.data?.forEach(item => {
    if (item.created_at) {
      const day = toMexicoDate(item.created_at);
      usersByDay.set(day, (usersByDay.get(day) || 0) + 1);
    }
  });

  // Procesar cupones ganados (agrupar por día en zona México)
  couponsData.data?.forEach(item => {
    if (item.created_at) {
      const day = toMexicoDate(item.created_at);
      couponsByDay.set(day, (couponsByDay.get(day) || 0) + 1);
    }
  });

  // Procesar cupones canjeados (agrupar por día en zona México)
  redeemedCouponsData.data?.forEach(item => {
    if (item.redeemed_at) {
      const day = toMexicoDate(item.redeemed_at);
      redeemedByDay.set(day, (redeemedByDay.get(day) || 0) + 1);
    }
  });

  // Generar datos para cada día (en zona México)
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    // Usar la misma conversión para la key del mapa
    const dayKey = date.toLocaleDateString('en-US', { timeZone: MEXICO_TZ });

    dates.push(formatMexicoDate(date));
    checkins.push(checkinsByDay.get(dayKey) || 0);
    newUsers.push(usersByDay.get(dayKey) || 0);
    couponsWon.push(couponsByDay.get(dayKey) || 0);
    couponsRedeemed.push(redeemedByDay.get(dayKey) || 0);
  }

  return { dates, checkins, newUsers, couponsWon, couponsRedeemed };
}

// Obtener top clientes (OPTIMIZADO - Zona horaria México)
async function getTopClients(supabase: ReturnType<typeof createAdminClient>, startDate?: Date, endDate?: Date): Promise<TopClient[]> {
  try {
    // Construir consultas base
    let checkinQuery = supabase
      .from('check_ins')
      .select('user_id')
      .not('user_id', 'is', null);
    
    let couponQuery = supabase
      .from('coupons')
      .select('user_id')
      .not('user_id', 'is', null);

    // Aplicar filtros de fecha si es necesario (convertir a UTC considerando zona México)
    if (startDate && endDate) {
      const startUTC = getMexicoDayStartUTC(startDate);
      const endUTC = getMexicoDayStartUTC(endDate);
      endUTC.setDate(endUTC.getDate() + 1); // Incluir todo el último día
      
      checkinQuery = checkinQuery
        .gte('created_at', startUTC.toISOString())
        .lt('created_at', endUTC.toISOString());
      
      couponQuery = couponQuery
        .gte('created_at', startUTC.toISOString())
        .lt('created_at', endUTC.toISOString());
    }

    // Ejecutar consultas en paralelo
    const [checkinsData, couponsData, usersData] = await Promise.all([
      checkinQuery,
      couponQuery,
      supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'client')
        .not('is_active', 'eq', false)
    ]);

    if (!checkinsData.data || !couponsData.data || !usersData.data) {
      return [];
    }

    // Contar check-ins por usuario
    const checkinCounts = new Map<string, number>();
    checkinsData.data.forEach(checkin => {
      if (checkin.user_id) {
        checkinCounts.set(checkin.user_id, (checkinCounts.get(checkin.user_id) || 0) + 1);
      }
    });

    // Contar cupones por usuario
    const couponCounts = new Map<string, number>();
    couponsData.data.forEach(coupon => {
      if (coupon.user_id) {
        couponCounts.set(coupon.user_id, (couponCounts.get(coupon.user_id) || 0) + 1);
      }
    });

    // Procesar usuarios y calcular estadísticas (email ya viene de user_profiles)
    const processedUsers = usersData.data.map(user => {
      const checkins = checkinCounts.get(user.id) || 0;
      const coupons = couponCounts.get(user.id) || 0;
      const email = user.email || '';
      
      const name = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`
        : email.split('@')[0] || 'Usuario';

      return {
        id: user.id,
        name,
        email,
        checkins,
        coupons,
      };
    });

    // Filtrar usuarios con actividad y ordenar
    return processedUsers
      .filter(user => user.checkins > 0 || user.coupons > 0)
      .sort((a, b) => (b.checkins + b.coupons) - (a.checkins + a.coupons))
      .slice(0, 10);

  } catch (error) {
    console.error('Error in getTopClients:', error);
    return [];
  }
}

// Obtener datos para período personalizado (Zona horaria México)
export async function getCustomPeriodStats(
  startDate: string, 
  endDate: string
): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const supabase = createAdminClient();
    
    // Las fechas del selector vienen como strings locales (ej: "2025-12-01")
    // Las interpretamos como fechas en México
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    // Convertir a UTC para queries considerando zona México
    const lastDayMidnightUTC = getMexicoDayStartUTC(end);
    const nextDayMidnightUTC = new Date(lastDayMidnightUTC.getTime() + (24 * 60 * 60 * 1000));

    const [dayCheckins, dayUsers, dayCoupons, dayRedeemedCoupons] = await Promise.all([
      supabase
        .from('check_ins')
        .select('id')
        .gte('created_at', lastDayMidnightUTC.toISOString())
        .lt('created_at', nextDayMidnightUTC.toISOString()),
      
      supabase
        .from('user_profiles')
        .select('id')
        .gte('created_at', lastDayMidnightUTC.toISOString())
        .lt('created_at', nextDayMidnightUTC.toISOString()),
      
      supabase
        .from('coupons')
        .select('id')
        .gte('created_at', lastDayMidnightUTC.toISOString())
        .lt('created_at', nextDayMidnightUTC.toISOString()),

      supabase
        .from('coupons')
        .select('id')
        .eq('is_redeemed', true)
        .gte('redeemed_at', lastDayMidnightUTC.toISOString())
        .lt('redeemed_at', nextDayMidnightUTC.toISOString())
    ]);

    // Obtener datos del período para gráficas
    const periodData = await getPeriodData(supabase, start, end);

    // Obtener top clientes del período
    const topClientsPeriod = await getTopClients(supabase, start, end);

    // Obtener top clientes de todos los tiempos
    const topClientsAllTime = await getTopClients(supabase);

    const stats: DashboardStats = {
      today: {
        checkins: dayCheckins.data?.length || 0,
        newUsers: dayUsers.data?.length || 0,
        couponsWon: dayCoupons.data?.length || 0,
        couponsRedeemed: dayRedeemedCoupons.data?.length || 0,
      },
      period: periodData,
      topClients: {
        period: topClientsPeriod,
        allTime: topClientsAllTime,
      },
    };

    return { success: true, data: stats };
  } catch {
    return {
      success: false,
      error: 'Error al obtener datos del período personalizado'
    };
  }
}
