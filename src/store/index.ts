import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import uiSlice from './slices/uiSlice'
import settingsSlice from './slices/settingsSlice'
import rouletteSlice from './slices/rouletteSlice'

// 🎯 CONFIGURACIÓN DE PERSISTENCIA
const persistConfig = {
  key: 'fuego-rewards-v2', // 🔥 CAMBIADO: Nueva key para reset de estado con nuevos campos
  storage,
  whitelist: ['auth', 'settings'], // Solo persistir auth y settings
  blacklist: ['ui', 'roulette'] // No persistir estado de UI ni roulette (temporal)
}

// 🔗 COMBINAR REDUCERS
const rootReducer = combineReducers({
  auth: authSlice,
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
