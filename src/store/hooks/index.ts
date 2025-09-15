import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from '../index'

// 🎯 HOOKS TIPADOS
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// 🔐 SELECTORES DE AUTH OPTIMIZADOS
export const useAuth = () => useAppSelector(state => state.auth)
export const useUser = () => useAppSelector(state => state.auth.user, (left, right) => {
  // 🎯 OPTIMIZACIÓN: Solo re-render si propiedades relevantes cambian
  if (!left && !right) return true
  if (!left || !right) return false
  return left.id === right.id && 
         left.current_streak === right.current_streak &&
         left.total_checkins === right.total_checkins &&
         left.available_spins === right.available_spins
})
export const useIsAuthenticated = () => useAppSelector(state => state.auth.isAuthenticated)
export const useAuthLoading = () => useAppSelector(state => state.auth.isLoading)
export const useAuthError = () => useAppSelector(state => state.auth.error)

// 🎨 SELECTORES DE UI
export const useCurrentView = () => useAppSelector(state => state.ui.currentView)
export const useOpenCheckin = () => useAppSelector(state => state.ui.openCheckin)
export const useIsRefreshing = () => useAppSelector(state => state.ui.isRefreshing)

// ⚙️ SELECTORES DE SETTINGS
export const useSettings = () => useAppSelector(state => state.settings.settings)
export const useSettingsLoading = () => useAppSelector(state => state.settings.isLoading)
export const useSetting = (key: string) => useAppSelector(state => state.settings.settings[key])
