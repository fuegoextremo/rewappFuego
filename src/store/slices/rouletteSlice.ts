import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 📋 TIPOS
interface RouletteState {
  isSpinning: boolean
  spinStartTime: number | null
  lockDuration: number // duración en ms del bloqueo total
  isNavigationBlocked: boolean
}

// 🏁 ESTADO INICIAL
const initialState: RouletteState = {
  isSpinning: false,
  spinStartTime: null,
  lockDuration: 6500, // 5000ms animación + 3000ms para ver resultado
  isNavigationBlocked: false
}

// 🍰 SLICE
const rouletteSlice = createSlice({
  name: 'roulette',
  initialState,
  reducers: {
    startSpin: (state) => {
      state.isSpinning = true
      state.spinStartTime = Date.now()
      state.isNavigationBlocked = true
    },
    
    endSpin: (state) => {
      state.isSpinning = false
      state.spinStartTime = null
      state.isNavigationBlocked = false
    },
    
    setLockDuration: (state, action: PayloadAction<number>) => {
      state.lockDuration = action.payload
    },
    
    // Para emergencias - forzar desbloqueo
    forceUnlock: (state) => {
      state.isSpinning = false
      state.spinStartTime = null
      state.isNavigationBlocked = false
    },
    
    // Actualizar solo el estado de bloqueo de navegación
    setNavigationBlocked: (state, action: PayloadAction<boolean>) => {
      state.isNavigationBlocked = action.payload
    }
  }
})

// 📤 EXPORT ACTIONS
export const { 
  startSpin, 
  endSpin, 
  setLockDuration, 
  forceUnlock, 
  setNavigationBlocked 
} = rouletteSlice.actions

// 🔍 SELECTORS
export const selectIsSpinning = (state: { roulette: RouletteState }) => state.roulette.isSpinning
export const selectSpinStartTime = (state: { roulette: RouletteState }) => state.roulette.spinStartTime
export const selectLockDuration = (state: { roulette: RouletteState }) => state.roulette.lockDuration
export const selectIsNavigationBlocked = (state: { roulette: RouletteState }) => state.roulette.isNavigationBlocked

// Selector computado para verificar si el bloqueo ha expirado
export const selectShouldBeUnlocked = (state: { roulette: RouletteState }) => {
  const { spinStartTime, lockDuration } = state.roulette
  if (!spinStartTime) return true
  return Date.now() - spinStartTime > lockDuration
}

// 📤 EXPORT REDUCER
export default rouletteSlice.reducer