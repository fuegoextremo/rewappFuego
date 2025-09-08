import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createClientBrowser } from '@/lib/supabase/client'

// 📋 TIPOS BASADOS EN database.ts
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
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

// 🏁 ESTADO INICIAL
const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null
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
      email: userId, // El ID es el email en Supabase Auth
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
    } catch (error: any) {
      return rejectWithValue(error.message)
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
        console.log('🎰 Redux: available_spins actualizado a:', action.payload)
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
  }
})

// 📤 EXPORT ACTIONS
export const { setUser, setLoading, setError, clearError, updateAvailableSpins } = authSlice.actions

// 📤 EXPORT REDUCER
export default authSlice.reducer
