import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import uiSlice from './slices/uiSlice'
import settingsSlice from './slices/settingsSlice'
import rouletteSlice from './slices/rouletteSlice'
import userDataSlice from './slices/userDataSlice'  // 🎯 FASE 2: Slice para datos dinámicos

// 🎯 CONFIGURACIÓN DE PERSISTENCIA - FASE 2: Excluir userData de persistencia
const persistConfig = {
  key: 'fuego-rewards-v3', // 🔥 NUEVA KEY: Reset para arquitectura limpia estático/dinámico
  storage,
  whitelist: ['auth', 'settings'], // Solo persistir datos estáticos
  blacklist: ['userData', 'ui', 'roulette'] // 🎯 FASE 2: userData NO se persiste (datos dinámicos)
}

// 🔗 COMBINAR REDUCERS - FASE 2: Agregar userDataSlice
const rootReducer = combineReducers({
  auth: authSlice,        // ✅ PERSISTIDO: datos estáticos del perfil
  userData: userDataSlice, // ❌ NO PERSISTIDO: datos dinámicos (streaks, spins, coupons)
  ui: uiSlice,
  settings: settingsSlice,
  roulette: rouletteSlice
})

// 🎨 PERSISTIR REDUCER
const persistedReducer = persistReducer(persistConfig, rootReducer)

// 🏪 CREAR STORE
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})

// 💾 PERSISTOR
export const persistor = persistStore(store)

// 📋 TIPOS (ARREGLADOS PARA PERSIST)
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
