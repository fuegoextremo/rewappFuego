import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 📋 TIPOS
export type SPAView = 'home' | 'profile' | 'coupons' | 'roulette'

interface UIState {
  currentView: SPAView
  openCheckin: boolean
  isRefreshing: boolean
}

// 🏁 ESTADO INICIAL
const initialState: UIState = {
  currentView: 'home',
  openCheckin: false,
  isRefreshing: false
}

// 🍰 SLICE
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<SPAView>) => {
      state.currentView = action.payload
    },
    setOpenCheckin: (state, action: PayloadAction<boolean>) => {
      state.openCheckin = action.payload
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload
    },
    resetUI: (state) => {
      state.currentView = 'home'
      state.openCheckin = false
      state.isRefreshing = false
    }
  }
})

// 📤 EXPORT ACTIONS
export const { setCurrentView, setOpenCheckin, setRefreshing, resetUI } = uiSlice.actions

// 📤 EXPORT REDUCER
export default uiSlice.reducer
