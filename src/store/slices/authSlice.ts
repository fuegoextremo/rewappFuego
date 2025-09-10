import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createClientBrowser } from '@/lib/supabase/client'

// 📋 TIPOS BASADOS EN LA ESTRUCTURA DE BASE DE DATOS
export interface User {
  id: string                   // UUID del usuario
  email: string                // Email (viene del auth)
  first_name: string | null    // Nombre
  last_name: string | null     // Apellido
  role: string | null          // Rol (client, admin, verifier, etc.)
  phone: string | null         // Teléfono
  branch_id: string | null     // FK a branches
  
  // Estadísticas calculadas
  total_checkins: number       // COUNT(*) from check_ins
  current_streak: number       // current_count from streaks
  available_spins: number      // available_spins from user_spins
  
  // 🔥 NUEVOS: Datos detallados de streak (para eliminar React Query)
  streakData?: {
    current_count: number
    expires_at: string | null
    last_check_in: string | null
  }
}

// 🎯 TIPOS PARA NUEVOS DATOS
export interface CheckInRow {
  id: string
  check_in_date: string | null
  spins_earned: number | null
  created_at: string | null
  branches?: {
    name: string
  } | null
}

export interface StreakPrize {
  id: string
  name: string
  description: string | null
  streak_threshold: number | null
  image_url: string | null
  validity_days: number | null
}

// 🎫 TIPO PARA CUPONES
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

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  coupons: {
    active: CouponRow[]
    expired: CouponRow[]
    hasMoreActive: boolean
    hasMoreExpired: boolean
    loadingMore: boolean
    totalActive: number    // 🆕 Total de cupones activos
    totalExpired: number   // 🆕 Total de cupones expirados
  }
  
  // 🔥 NUEVOS: Datos que estaban en React Query
  recentActivity: CheckInRow[]
  streakPrizes: StreakPrize[]
  streakPrizesLoaded: boolean
}

// 🏁 ESTADO INICIAL
const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  coupons: {
    active: [],
    expired: [],
    hasMoreActive: false,
    hasMoreExpired: false,
    loadingMore: false,
    totalActive: 0,    // 🆕 Inicial
    totalExpired: 0    // 🆕 Inicial
  },
  
  // 🔥 NUEVOS: Estados iniciales para datos que estaban en React Query
  recentActivity: [],
  streakPrizes: [],
  streakPrizesLoaded: false
}

// 🔄 ASYNC THUNKS
export const loadUserProfile = createAsyncThunk(
  'auth/loadUserProfile',
  async (userId: string) => {
    console.log('🔄 loadUserProfile STARTED for userId:', userId);
    const supabase = createClientBrowser()
    
    // 1. Cargar perfil del usuario desde user_profiles
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role, phone, branch_id')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ loadUserProfile ERROR in user_profiles:', error);
      throw new Error(error.message)
    }

    // 1.1. Obtener email desde auth.users
    const { data: authUser } = await supabase.auth.getUser()
    const email = authUser?.user?.email || null

    // 2. Cargar estadísticas de check_ins (total_checkins)
    const { data: checkinData } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', userId)

    // 3. Cargar racha actual desde streaks (current_count)
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_count')
      .eq('user_id', userId)
      .single()

    // 4. Cargar spins disponibles desde user_spins
    const { data: spinsData } = await supabase
      .from('user_spins')
      .select('available_spins')
      .eq('user_id', userId)
      .single()

    const totalCheckins = checkinData?.length || 0
    const currentStreak = streakData?.current_count || 0
    const availableSpins = spinsData?.available_spins || 0
    
    console.log('🔄 loadUserProfile COMPLETED:', { 
      userId, 
      totalCheckins, 
      currentStreak, 
      availableSpins,
      spinsData 
    });
    
    return {
      id: profile.id,
      email: email || 'sin-email@ejemplo.com', // Email real desde auth.users con fallback
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      phone: profile.phone,
      branch_id: profile.branch_id,
      total_checkins: totalCheckins,
      current_streak: currentStreak,
      available_spins: availableSpins
    }
  }
)

// 🔥 ASYNC THUNK PARA REALIZAR CHECKIN
export const performCheckin = createAsyncThunk(
  'auth/performCheckin',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const userId = state.auth.user?.id
      
      if (!userId) {
        throw new Error('Usuario no autenticado')
      }

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error en checkin')
      }

      const result = await response.json()
      return result
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return rejectWithValue(errorMessage)
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    const supabase = createClientBrowser()
    await supabase.auth.signOut()
  }
)

// 🔥 NUEVOS ASYNC THUNKS para migrar de React Query a Redux

export const loadRecentActivity = createAsyncThunk(
  'auth/loadRecentActivity',
  async (userId: string) => {
    const supabase = createClientBrowser()
    const ITEMS_PER_PAGE = 10
    
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        id,
        check_in_date,
        spins_earned,
        created_at,
        branches (
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(ITEMS_PER_PAGE)

    if (error) throw new Error(error.message)
    return data || []
  }
)

export const loadStreakPrizes = createAsyncThunk(
  'auth/loadStreakPrizes',
  async () => {
    const supabase = createClientBrowser()
    
    const { data, error } = await supabase
      .from('prizes')
      .select('id, name, description, streak_threshold, image_url, validity_days')
      .eq('type', 'streak')
      .eq('is_active', true)
      .order('streak_threshold', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  }
)

export const loadUserStreakData = createAsyncThunk(
  'auth/loadUserStreakData',
  async (userId: string) => {
    const supabase = createClientBrowser()
    
    const { data, error } = await supabase
      .from('streaks')
      .select('current_count, expires_at, last_check_in')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(error.message)
    }
    
    // Asegurar que current_count sea número, no null
    return {
      current_count: data?.current_count || 0,
      expires_at: data?.expires_at || null,
      last_check_in: data?.last_check_in || null
    }
  }
)

// 🍰 SLICE
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    // 🎰 Action granular para actualizar solo spins via Realtime
    updateAvailableSpins: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.available_spins = action.payload
      }
    },
    
    // 🔥 Actions granulares para actualizaciones realtime de checkins
    incrementTotalCheckins: (state) => {
      if (state.user) {
        state.user.total_checkins = (state.user.total_checkins || 0) + 1
      }
    },
    
    updateCurrentStreak: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.current_streak = action.payload
      }
    },
    
    addAvailableSpins: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.available_spins = (state.user.available_spins || 0) + action.payload
      }
    },
    
    // 🎫 REDUCERS PARA CUPONES (Realtime + Paginación)
    setCoupons: (state, action: PayloadAction<{ 
      active: CouponRow[], 
      expired: CouponRow[], 
      hasMoreActive: boolean, 
      hasMoreExpired: boolean,
      totalActive: number,      // 🆕 Incluir totales
      totalExpired: number      // 🆕 Incluir totales
    }>) => {
      if (!state.coupons) {
        state.coupons = {
          active: [],
          expired: [],
          hasMoreActive: false,
          hasMoreExpired: false,
          loadingMore: false,
          totalActive: 0,
          totalExpired: 0
        }
      }
      state.coupons.active = action.payload.active
      state.coupons.expired = action.payload.expired
      state.coupons.hasMoreActive = action.payload.hasMoreActive
      state.coupons.hasMoreExpired = action.payload.hasMoreExpired
      state.coupons.totalActive = action.payload.totalActive      // 🆕 Establecer totales
      state.coupons.totalExpired = action.payload.totalExpired    // 🆕 Establecer totales
    },
    
    addActiveCoupon: (state, action: PayloadAction<CouponRow>) => {
      state.coupons.active.unshift(action.payload)
      state.coupons.totalActive += 1
    },
    
    prependExpiredCoupon: (state, action: PayloadAction<CouponRow>) => {
      state.coupons.expired.unshift(action.payload)
      state.coupons.totalExpired += 1
    },
    
    moveCouponToExpired: (state, action: PayloadAction<CouponRow>) => {
      const couponId = action.payload.id
      const wasActive = state.coupons.active.some(c => c.id === couponId)
      
      state.coupons.active = state.coupons.active.filter(c => c.id !== couponId)
      state.coupons.expired.unshift(action.payload)
      
      // 🆕 Actualizar contadores
      if (wasActive) {
        state.coupons.totalActive -= 1
        state.coupons.totalExpired += 1
      }
    },
    
    updateCouponDetails: (state, action: PayloadAction<CouponRow>) => {
      const coupon = action.payload
      
      const activeIndex = state.coupons.active.findIndex(c => c.id === coupon.id)
      if (activeIndex !== -1) {
        state.coupons.active[activeIndex] = coupon
      }
      
      const expiredIndex = state.coupons.expired.findIndex(c => c.id === coupon.id)
      if (expiredIndex !== -1) {
        state.coupons.expired[expiredIndex] = coupon
      }
    },
    
    appendExpiredCoupons: (state, action: PayloadAction<{ coupons: CouponRow[], hasMore: boolean }>) => {
      state.coupons.expired.push(...action.payload.coupons)
      state.coupons.hasMoreExpired = action.payload.hasMore
      state.coupons.loadingMore = false
    },
    
    appendActiveCoupons: (state, action: PayloadAction<{ coupons: CouponRow[], hasMore: boolean }>) => {
      state.coupons.active.push(...action.payload.coupons)
      state.coupons.hasMoreActive = action.payload.hasMore
      state.coupons.loadingMore = false
    },
    
    setLoadingMoreCoupons: (state, action: PayloadAction<boolean>) => {
      state.coupons.loadingMore = action.payload
    },
    
    // 🔥 NUEVOS REDUCERS para datos que estaban en React Query
    
    // Recent Activity Actions
    setRecentActivity: (state, action: PayloadAction<CheckInRow[]>) => {
      state.recentActivity = action.payload
    },
    
    prependRecentActivity: (state, action: PayloadAction<CheckInRow>) => {
      // Asegurar que recentActivity esté inicializado
      if (!state.recentActivity) {
        state.recentActivity = []
      }
      state.recentActivity.unshift(action.payload)
      // Mantener solo los últimos 10 para performance
      if (state.recentActivity.length > 10) {
        state.recentActivity = state.recentActivity.slice(0, 10)
      }
    },
    
    // Streak Prizes Actions
    setStreakPrizes: (state, action: PayloadAction<StreakPrize[]>) => {
      state.streakPrizes = action.payload
      state.streakPrizesLoaded = true
    },
    
    // User Streak Data Actions
    setUserStreakData: (state, action: PayloadAction<{ current_count: number, expires_at: string | null, last_check_in: string | null }>) => {
      if (state.user) {
        state.user.streakData = action.payload
        // También mantener current_streak sincronizado
        state.user.current_streak = action.payload.current_count
      }
    },
    
    updateUserStreakData: (state, action: PayloadAction<Partial<{ current_count: number, expires_at: string | null, last_check_in: string | null }>>) => {
      if (state.user?.streakData) {
        state.user.streakData = { ...state.user.streakData, ...action.payload }
        // Sincronizar current_streak si se actualiza
        if (action.payload.current_count !== undefined) {
          state.user.current_streak = action.payload.current_count
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Load User Profile
      .addCase(loadUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Error loading user profile'
      })
      // Perform Checkin
      .addCase(performCheckin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(performCheckin.fulfilled, (state, action) => {
        state.isLoading = false
        // Actualizar estadísticas del usuario después del checkin exitoso
        if (state.user && action.payload.success) {
          state.user.total_checkins = (state.user.total_checkins || 0) + 1
          state.user.current_streak = action.payload.current_streak || state.user.current_streak
          state.user.available_spins = (state.user.available_spins || 0) + (action.payload.spins_earned || 0)
        }
      })
      .addCase(performCheckin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string || 'Error performing checkin'
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Error during logout'
      })
      
      // 🔥 NUEVOS: Extra reducers para migración de React Query
      
      // Load Recent Activity
      .addCase(loadRecentActivity.pending, () => {
        // No mostrar loading global para estos datos
      })
      .addCase(loadRecentActivity.fulfilled, (state, action) => {
        state.recentActivity = action.payload
      })
      .addCase(loadRecentActivity.rejected, (state, action) => {
        console.error('Error loading recent activity:', action.error.message)
      })
      
      // Load Streak Prizes
      .addCase(loadStreakPrizes.pending, (state) => {
        state.streakPrizesLoaded = false
      })
      .addCase(loadStreakPrizes.fulfilled, (state, action) => {
        state.streakPrizes = action.payload
        state.streakPrizesLoaded = true
      })
      .addCase(loadStreakPrizes.rejected, (state, action) => {
        state.streakPrizesLoaded = false
        console.error('Error loading streak prizes:', action.error.message)
      })
      
      // Load User Streak Data
      .addCase(loadUserStreakData.pending, () => {
        // No loading state para este
      })
      .addCase(loadUserStreakData.fulfilled, (state, action) => {
        if (state.user) {
          state.user.streakData = action.payload
          // Mantener current_streak sincronizado
          state.user.current_streak = action.payload.current_count
        }
      })
      .addCase(loadUserStreakData.rejected, (state, action) => {
        console.error('Error loading user streak data:', action.error.message)
      })
  }
})

// 📤 EXPORT ACTIONS
export const { 
  setUser, 
  setLoading, 
  setError, 
  clearError, 
  updateAvailableSpins,
  incrementTotalCheckins,
  updateCurrentStreak,
  addAvailableSpins,
  setCoupons,
  addActiveCoupon,
  prependExpiredCoupon,
  moveCouponToExpired,
  updateCouponDetails,
  appendExpiredCoupons,
  appendActiveCoupons,
  setLoadingMoreCoupons,
  
  // 🔥 NUEVAS ACCIONES para migración de React Query
  setRecentActivity,
  prependRecentActivity,
  setStreakPrizes,
  setUserStreakData,
  updateUserStreakData
} = authSlice.actions

// 📤 EXPORT REDUCER
export default authSlice.reducer
