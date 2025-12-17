import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createClientBrowser } from '@/lib/supabase/client'
import type { RootState } from '@/store'

// 🎯 FASE 2: Slice dedicado para datos dinámicos (NO persistidos)
// Este slice contiene todos los datos que cambian frecuentemente y deben
// ser invalidados automáticamente sin conflictos con Redux-persist

// 📋 TIPOS IMPORTADOS (mantener consistencia con authSlice)
export interface CheckInRow {
  id: string
  check_in_date: string | null
  spins_earned: number | null
  created_at: string | null
  branches?: {
    name: string
  } | null
}

export interface CouponRow {
  id: string
  unique_code: string | null
  expires_at: string | null
  is_redeemed: boolean | null
  redeemed_at: string | null
  source: string | null
  created_at: string | null
  prizes: { name: string; image_url: string | null } | null
}

// 🔥 NUEVOS TIPOS ESPECÍFICOS PARA userData
export interface UserStats {
  total_checkins: number
  max_streak: number
  available_spins: number
  last_check_in: string | null
  // ❌ current_streak ELIMINADO - usar streakData.current_count como fuente única
}

export interface StreakData {
  current_count: number
  completed_count: number
  is_just_completed: boolean
  expires_at: string | null
}

export interface CouponsData {
  active: CouponRow[]
  expired: CouponRow[]
  hasMoreActive: boolean
  hasMoreExpired: boolean
  loadingMore: boolean
  totalActive: number
  totalExpired: number
}

// 🏪 ESTADO DEL SLICE userData
interface UserDataState {
  // 📊 Estadísticas del usuario (datos que cambian con check-ins/spins)
  userStats: UserStats | null
  userStatsLoading: boolean
  userStatsError: string | null
  
  // 🔥 Datos de racha (sincronizados por realtime)
  streakData: StreakData | null
  streakDataLoading: boolean
  streakDataError: string | null
  
  // 🎫 Cupones (paginados, dinámicos)
  coupons: CouponsData
  couponsLoading: boolean
  couponsError: string | null
  
  // 📈 Actividad reciente (lista dinámica)
  recentActivity: CheckInRow[]
  recentActivityLoading: boolean
  recentActivityError: string | null
  recentActivityLoaded: boolean
}

// 🏁 ESTADO INICIAL
const initialState: UserDataState = {
  // UserStats
  userStats: null,
  userStatsLoading: false,
  userStatsError: null,
  
  // StreakData
  streakData: null,
  streakDataLoading: false,
  streakDataError: null,
  
  // Coupons
  coupons: {
    active: [],
    expired: [],
    hasMoreActive: false,
    hasMoreExpired: false,
    loadingMore: false,
    totalActive: 0,
    totalExpired: 0,
  },
  couponsLoading: false,
  couponsError: null,
  
  // Recent Activity
  recentActivity: [],
  recentActivityLoading: false,
  recentActivityError: null,
  recentActivityLoaded: false,
}

// 🎯 ASYNC THUNKS para cargar datos dinámicos
export const loadUserStats = createAsyncThunk(
  'userData/loadUserStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClientBrowser()
      
      // 📊 Obtener count de check-ins del usuario  
      const { count: totalCheckins, error: checkinsError } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      
      if (checkinsError) throw checkinsError
      
      // 🔥 Obtener datos de racha (solo max_count, no last_check_in)
      const { data: streakData, error: streakError } = await supabase
        .from('streaks')
        .select('current_count, max_count')
        .eq('user_id', userId)
        .single()
      
      if (streakError) throw streakError
      
      // 🎰 Obtener spins disponibles
      const { data: spinsData, error: spinsError } = await supabase
        .from('user_spins')
        .select('available_spins')
        .eq('user_id', userId)
        .single()
      
      if (spinsError) throw spinsError

      // 📅 Obtener ultimo check-in REAL de la tabla check_ins
      const { data: lastCheckinData } = await supabase
        .from('check_ins')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      return {
        total_checkins: totalCheckins || 0,
        max_streak: streakData?.max_count || 0,
        available_spins: spinsData?.available_spins || 0,
        last_check_in: lastCheckinData?.created_at || null,  // CORREGIDO: de check_ins, no de streaks
      } as UserStats
      
    } catch (error: unknown) {
      console.error('❌ Error loading user stats:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error loading user stats'
      return rejectWithValue(errorMessage)
    }
  }
)

export const loadStreakData = createAsyncThunk(
  'userData/loadStreakData',
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClientBrowser()
      
      const { data, error } = await supabase
        .from('streaks')
        .select('current_count, completed_count, is_just_completed, expires_at')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      
      return {
        current_count: data?.current_count || 0,
        completed_count: data?.completed_count || 0,
        is_just_completed: data?.is_just_completed || false,
        expires_at: data?.expires_at || null,
      } as StreakData
      
    } catch (error: unknown) {
      console.error('❌ Error loading streak data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error loading streak data'
      return rejectWithValue(errorMessage)
    }
  }
)

// 🎯 SLICE DEFINITION
const userDataSlice = createSlice({
  name: 'userData',
  initialState,
  reducers: {
    // 📊 Actualizar estadísticas del usuario (desde realtime)
    updateUserStats: (state, action: PayloadAction<Partial<UserStats>>) => {
      if (state.userStats) {
        state.userStats = { ...state.userStats, ...action.payload }
      } else {
        // Si no existe userStats, crear con valores por defecto
        state.userStats = {
          total_checkins: 0,
          max_streak: 0,
          available_spins: 0,
          last_check_in: null,
          ...action.payload
        }
      }
    },
    
    // 🔥 Actualizar datos de racha (desde realtime)
    updateStreakData: (state, action: PayloadAction<Partial<StreakData>>) => {
      if (state.streakData) {
        state.streakData = { ...state.streakData, ...action.payload }
      } else {
        state.streakData = {
          current_count: 0,
          completed_count: 0,
          is_just_completed: false,
          expires_at: null,
          ...action.payload
        }
      }
    },
    
    // 🎫 Actualizar cupones
    updateCoupons: (state, action: PayloadAction<Partial<CouponsData>>) => {
      state.coupons = { ...state.coupons, ...action.payload }
    },
    
    // 📈 Actualizar actividad reciente
    updateRecentActivity: (state, action: PayloadAction<CheckInRow[]>) => {
      state.recentActivity = action.payload
      state.recentActivityLoaded = true
    },
    
    // 🔄 Reset userData (para logout)
    resetUserData: () => {
      return initialState
    },
    
    // 🎯 Setters específicos para compatibilidad con código existente
    setUserStatsLoading: (state, action: PayloadAction<boolean>) => {
      state.userStatsLoading = action.payload
    },
    
    setStreakDataLoading: (state, action: PayloadAction<boolean>) => {
      state.streakDataLoading = action.payload
    },
  },
  
  extraReducers: (builder) => {
    // 📊 LoadUserStats
    builder
      .addCase(loadUserStats.pending, (state) => {
        state.userStatsLoading = true
        state.userStatsError = null
      })
      .addCase(loadUserStats.fulfilled, (state, action) => {
        state.userStatsLoading = false
        state.userStats = action.payload
        state.userStatsError = null
      })
      .addCase(loadUserStats.rejected, (state, action) => {
        state.userStatsLoading = false
        state.userStatsError = action.payload as string
      })
    
    // 🔥 LoadStreakData
    builder
      .addCase(loadStreakData.pending, (state) => {
        state.streakDataLoading = true
        state.streakDataError = null
      })
      .addCase(loadStreakData.fulfilled, (state, action) => {
        state.streakDataLoading = false
        state.streakData = action.payload
        state.streakDataError = null
      })
      .addCase(loadStreakData.rejected, (state, action) => {
        state.streakDataLoading = false
        state.streakDataError = action.payload as string
      })
  },
})

// 🔄 EXPORTS
export const {
  updateUserStats,
  updateStreakData,
  updateCoupons,
  updateRecentActivity,
  resetUserData,
  setUserStatsLoading,
  setStreakDataLoading,
} = userDataSlice.actions

export default userDataSlice.reducer

// 🎯 SELECTORS para acceso conveniente  
export const selectUserStats = (state: RootState) => state.userData?.userStats
export const selectStreakData = (state: RootState) => state.userData?.streakData
export const selectCoupons = (state: RootState) => state.userData?.coupons
export const selectRecentActivity = (state: RootState) => state.userData?.recentActivity