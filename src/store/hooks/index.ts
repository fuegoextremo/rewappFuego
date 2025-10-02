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
// 🔄 RETROCOMPATIBILIDAD: useAuthLoading sigue funcionando
export const useAuthLoading = () => useAppSelector(state => 
  state.auth.isInitialLoading || state.auth.isSilentRefreshing
)
// 🆕 NUEVOS SELECTORES específicos
export const useIsInitialLoading = () => useAppSelector(state => state.auth.isInitialLoading)
export const useIsSilentRefreshing = () => useAppSelector(state => state.auth.isSilentRefreshing)
export const useAuthError = () => useAppSelector(state => state.auth.error)

// FASE 3: HOOKS PARA DATOS DINÁMICOS (userData slice - NO persistidos)
export const useCurrentStreak = () => useAppSelector(state => state.userData?.streakData?.current_count || 0)
export const useMaxStreak = () => useAppSelector(state => state.userData?.userStats?.max_streak || 0)
export const useAvailableSpins = () => useAppSelector(state => state.userData?.userStats?.available_spins || 0)
export const useLastCheckIn = () => useAppSelector(state => state.userData?.userStats?.last_check_in || null)
export const useTotalCheckIns = () => useAppSelector(state => state.userData?.userStats?.total_checkins || 0)

// Hooks para datos de racha específicos
export const useStreakData = () => useAppSelector(state => state.userData?.streakData)
export const useStreakCount = () => useAppSelector(state => state.userData?.streakData?.current_count || 0)
export const useCompletedStreaks = () => useAppSelector(state => state.userData?.streakData?.completed_count || 0)
export const useIsStreakJustCompleted = () => useAppSelector(state => state.userData?.streakData?.is_just_completed || false)

// Hooks para cupones
export const useCoupons = () => useAppSelector(state => state.userData?.coupons)
export const useActiveCoupons = () => useAppSelector(state => state.userData?.coupons?.active || [])
export const useExpiredCoupons = () => useAppSelector(state => state.userData?.coupons?.expired || [])

// 🎨 SELECTORES DE UI
export const useCurrentView = () => useAppSelector(state => state.ui.currentView)
export const useOpenCheckin = () => useAppSelector(state => state.ui.openCheckin)
export const useIsRefreshing = () => useAppSelector(state => state.ui.isRefreshing)

// ⚙️ SELECTORES DE SETTINGS
export const useSettings = () => useAppSelector(state => state.settings.settings)
export const useSettingsLoading = () => useAppSelector(state => state.settings.isLoading)
export const useSetting = (key: string) => useAppSelector(state => state.settings.settings[key])

// 🎰 SELECTORES DE ROULETTE
export const useIsSpinning = () => useAppSelector(state => state.roulette.isSpinning)
export const useIsNavigationBlocked = () => useAppSelector(state => state.roulette.isNavigationBlocked)
export const useSpinStartTime = () => useAppSelector(state => state.roulette.spinStartTime)
export const useLockDuration = () => useAppSelector(state => state.roulette.lockDuration)
export const useShouldBeUnlocked = () => useAppSelector(state => {
  const { spinStartTime, lockDuration } = state.roulette
  if (!spinStartTime) return true
  return Date.now() - spinStartTime > lockDuration
})
