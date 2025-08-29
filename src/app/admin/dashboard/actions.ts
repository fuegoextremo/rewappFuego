"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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
  totalPoints: number;
}

// Obtener estadísticas del dashboard (OPTIMIZADO)
export async function getDashboardStats(days: number = 7): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const supabase = createAdminClient();
    
    // Calcular fechas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Optimizar consultas de hoy usando Promise.all con consultas más simples
    const [todayStats, periodData, topClientsPeriod, topClientsAllTime] = await Promise.all([
      // Estadísticas de hoy en una sola consulta por tabla
      Promise.all([
        supabase.from('check_ins').select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        
        supabase.from('user_profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        
        supabase.from('coupons').select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),

        supabase.from('coupons').select('id', { count: 'exact', head: true })
          .eq('is_redeemed', true)
          .gte('redeemed_at', today.toISOString())
          .lt('redeemed_at', tomorrow.toISOString())
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

// Obtener datos del período para las gráficas (OPTIMIZADO)
async function getPeriodData(supabase: ReturnType<typeof createAdminClient>, startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Hacer todas las consultas en paralelo una sola vez
  const [checkinsData, usersData, couponsData, redeemedCouponsData] = await Promise.all([
    // Todos los check-ins del período
    supabase
      .from('check_ins')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()),

    // Todos los usuarios nuevos del período
    supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()),

    // Todos los cupones ganados del período
    supabase
      .from('coupons')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()),

    // Todos los cupones canjeados del período
    supabase
      .from('coupons')
      .select('redeemed_at')
      .eq('is_redeemed', true)
      .gte('redeemed_at', startDate.toISOString())
      .lt('redeemed_at', endDate.toISOString())
  ]);

  // Inicializar arrays para cada día
  const dates: string[] = [];
  const checkins: number[] = [];
  const newUsers: number[] = [];
  const couponsWon: number[] = [];
  const couponsRedeemed: number[] = [];

  // Crear mapas para contar por día
  const checkinsByDay = new Map<string, number>();
  const usersByDay = new Map<string, number>();
  const couponsByDay = new Map<string, number>();
  const redeemedByDay = new Map<string, number>();

  // Procesar check-ins
  checkinsData.data?.forEach(item => {
    if (item.created_at) {
      const day = new Date(item.created_at).toDateString();
      checkinsByDay.set(day, (checkinsByDay.get(day) || 0) + 1);
    }
  });

  // Procesar usuarios
  usersData.data?.forEach(item => {
    if (item.created_at) {
      const day = new Date(item.created_at).toDateString();
      usersByDay.set(day, (usersByDay.get(day) || 0) + 1);
    }
  });

  // Procesar cupones ganados
  couponsData.data?.forEach(item => {
    if (item.created_at) {
      const day = new Date(item.created_at).toDateString();
      couponsByDay.set(day, (couponsByDay.get(day) || 0) + 1);
    }
  });

  // Procesar cupones canjeados
  redeemedCouponsData.data?.forEach(item => {
    if (item.redeemed_at) {
      const day = new Date(item.redeemed_at).toDateString();
      redeemedByDay.set(day, (redeemedByDay.get(day) || 0) + 1);
    }
  });

  // Generar datos para cada día
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dayKey = date.toDateString();

    dates.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
    checkins.push(checkinsByDay.get(dayKey) || 0);
    newUsers.push(usersByDay.get(dayKey) || 0);
    couponsWon.push(couponsByDay.get(dayKey) || 0);
    couponsRedeemed.push(redeemedByDay.get(dayKey) || 0);
  }

  return { dates, checkins, newUsers, couponsWon, couponsRedeemed };
}

// Obtener top clientes (OPTIMIZADO)
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

    // Aplicar filtros de fecha si es necesario
    if (startDate && endDate) {
      checkinQuery = checkinQuery
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      
      couponQuery = couponQuery
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
    }

    // Ejecutar consultas en paralelo
    const [checkinsData, couponsData, usersData] = await Promise.all([
      checkinQuery,
      couponQuery,
      supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
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

    // Obtener emails solo para los usuarios activos
    const activeUserIds = usersData.data.map(user => user.id);
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const emailMap = new Map(
      authUsers.users
        .filter(user => activeUserIds.includes(user.id))
        .map(user => [user.id, user.email])
    );

    // Procesar usuarios y calcular estadísticas
    const processedUsers = usersData.data.map(user => {
      const checkins = checkinCounts.get(user.id) || 0;
      const coupons = couponCounts.get(user.id) || 0;
      const email = emailMap.get(user.id) || '';
      
      const name = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`
        : email.split('@')[0] || 'Usuario';

      return {
        id: user.id,
        name,
        email,
        checkins,
        coupons,
        totalPoints: checkins * 10, // 10 puntos por check-in
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

// Obtener datos para período personalizado
export async function getCustomPeriodStats(
  startDate: string, 
  endDate: string
): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const supabase = createAdminClient();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Incluir todo el día final
    
    // Obtener estadísticas del último día del período
    const lastDay = new Date(end);
    lastDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(lastDay);
    nextDay.setDate(lastDay.getDate() + 1);

    const [dayCheckins, dayUsers, dayCoupons, dayRedeemedCoupons] = await Promise.all([
      supabase
        .from('check_ins')
        .select('id')
        .gte('created_at', lastDay.toISOString())
        .lt('created_at', nextDay.toISOString()),
      
      supabase
        .from('user_profiles')
        .select('id')
        .gte('created_at', lastDay.toISOString())
        .lt('created_at', nextDay.toISOString()),
      
      supabase
        .from('coupons')
        .select('id')
        .gte('created_at', lastDay.toISOString())
        .lt('created_at', nextDay.toISOString()),

      supabase
        .from('coupons')
        .select('id')
        .eq('is_redeemed', true)
        .gte('redeemed_at', lastDay.toISOString())
        .lt('redeemed_at', nextDay.toISOString())
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
