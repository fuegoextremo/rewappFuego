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

// Obtener estadísticas del dashboard
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

    // Obtener estadísticas de hoy
    const [todayCheckins, todayUsers, todayCoupons, todayRedeemedCoupons] = await Promise.all([
      // Check-ins de hoy
      supabase
        .from('check_ins')
        .select('id')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()),
      
      // Usuarios nuevos hoy
      supabase
        .from('user_profiles')
        .select('id')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()),
      
      // Cupones ganados hoy
      supabase
        .from('coupons')
        .select('id')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()),

      // Cupones canjeados hoy
      supabase
        .from('coupons')
        .select('id')
        .eq('is_redeemed', true)
        .gte('redeemed_at', today.toISOString())
        .lt('redeemed_at', tomorrow.toISOString())
    ]);

    // Obtener datos del período para gráficas
    const periodData = await getPeriodData(supabase, startDate, endDate);

    // Obtener top clientes del período
    const topClientsPeriod = await getTopClients(supabase, startDate, endDate);

    // Obtener top clientes de todos los tiempos
    const topClientsAllTime = await getTopClients(supabase);

    const stats: DashboardStats = {
      today: {
        checkins: todayCheckins.data?.length || 0,
        newUsers: todayUsers.data?.length || 0,
        couponsWon: todayCoupons.data?.length || 0,
        couponsRedeemed: todayRedeemedCoupons.data?.length || 0,
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
      error: 'Error al obtener estadísticas del dashboard'
    };
  }
}

// Obtener datos del período para las gráficas
async function getPeriodData(supabase: ReturnType<typeof createAdminClient>, startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dates: string[] = [];
  const checkins: number[] = [];
  const newUsers: number[] = [];
  const couponsWon: number[] = [];
  const couponsRedeemed: number[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    dates.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));

    // Check-ins del día
    const { data: dayCheckins } = await supabase
      .from('check_ins')
      .select('id')
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString());

    // Usuarios nuevos del día
    const { data: dayUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString());

    // Cupones ganados del día
    const { data: dayCoupons } = await supabase
      .from('coupons')
      .select('id')
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString());

    // Cupones canjeados del día
    const { data: dayRedeemedCoupons } = await supabase
      .from('coupons')
      .select('id')
      .eq('is_redeemed', true)
      .gte('redeemed_at', date.toISOString())
      .lt('redeemed_at', nextDate.toISOString());

    checkins.push(dayCheckins?.length || 0);
    newUsers.push(dayUsers?.length || 0);
    couponsWon.push(dayCoupons?.length || 0);
    couponsRedeemed.push(dayRedeemedCoupons?.length || 0);
  }

  return { dates, checkins, newUsers, couponsWon, couponsRedeemed };
}

// Obtener top clientes
async function getTopClients(supabase: ReturnType<typeof createAdminClient>, startDate?: Date, endDate?: Date): Promise<TopClient[]> {
  // Primero obtenemos los usuarios con sus stats
  const { data: users } = await supabase
    .from('user_profiles')
    .select(`
      id,
      first_name,
      last_name,
      check_ins!check_ins_user_id_fkey (id, created_at),
      coupons!coupons_user_id_fkey (id, created_at)
    `)
    .eq('role', 'client')
    .not('is_active', 'eq', false);

  if (!users) {
    return [];
  }

  // Obtener emails de auth.users
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailMap = new Map(authUsers.users.map(user => [user.id, user.email]));

  // Procesar y calcular estadísticas
  const processedUsers = users.map((user) => {
    let checkins = user.check_ins || [];
    let coupons = user.coupons || [];

    // Filtrar por período si se especifica
    if (startDate && endDate) {
      checkins = checkins.filter((checkin) => {
        if (!checkin.created_at) return false;
        const checkinDate = new Date(checkin.created_at);
        return checkinDate >= startDate && checkinDate <= endDate;
      });

      coupons = coupons.filter((coupon) => {
        if (!coupon.created_at) return false;
        const couponDate = new Date(coupon.created_at);
        return couponDate >= startDate && couponDate <= endDate;
      });
    }

    const email = emailMap.get(user.id) || '';
    const name = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : email.split('@')[0] || 'Usuario';

    return {
      id: user.id,
      name,
      email,
      checkins: checkins.length,
      coupons: coupons.length,
      totalPoints: checkins.length * 10, // Asumiendo 10 puntos por check-in
    };
  });

  // Ordenar por check-ins + cupones y tomar top 10
  return processedUsers
    .sort((a: TopClient, b: TopClient) => (b.checkins + b.coupons) - (a.checkins + a.coupons))
    .slice(0, 10);
}

// Obtener datos para período personalizado
export async function getCustomPeriodStats(
  startDate: string, 
  endDate: string
): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return await getDashboardStats(days);
  } catch {
    return {
      success: false,
      error: 'Error al obtener datos del período personalizado'
    };
  }
}
