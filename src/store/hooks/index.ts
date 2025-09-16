import { useSelector, useDispatch } from 'react-redux'
import { shallowEqual } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from '..'

// 🎯 HOOKS TIPADOS
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// 🔐 SELECTORES DE AUTH OPTIMIZADOS
export const useAuth = () => useAppSelector(state => state.auth)
// 🔧 OPTIMIZADO: Selector con shallow comparison para evitar re-renders innecesarios
export const useUser = () => useSelector((state: RootState) => state.auth.user, shallowEqual)
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
