import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createClientBrowser } from '@/lib/supabase/client'

// 📋 TIPOS
interface SettingsState {
  settings: Record<string, string>
  isLoading: boolean
  error: string | null
}

// 🏁 ESTADO INICIAL
const initialState: SettingsState = {
  settings: {},
  isLoading: false,
  error: null
}

// 🔄 ASYNC THUNKS
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async () => {
    const supabase = createClientBrowser()
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('is_active', true)
    
    if (error) {
      throw new Error(error.message)
    }
    
    const settings = data?.reduce((acc: Record<string, string>, { key, value }) => {
      acc[key] = value
      return acc
    }, {}) || {}
    
    return settings
  }
)

// 🍰 SLICE
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Record<string, string>>) => {
      state.settings = action.payload
    },
    updateSetting: (state, action: PayloadAction<{ key: string; value: string }>) => {
      state.settings[action.payload.key] = action.payload.value
    },
    clearSettings: (state) => {
      state.settings = {}
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false
        state.settings = action.payload
        state.error = null
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Error loading settings'
      })
  }
})

// 📤 EXPORT ACTIONS
export const { setSettings, updateSetting, clearSettings } = settingsSlice.actions

// 📤 EXPORT REDUCER
export default settingsSlice.reducer
