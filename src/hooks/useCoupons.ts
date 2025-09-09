import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { 
  setCoupons, 
  appendExpiredCoupons, 
  appendActiveCoupons,
  setLoadingMoreCoupons,
  type CouponRow 
} from '@/store/slices/authSlice'
import { createClientBrowser } from '@/lib/supabase/client'

/**
 * 🎫 Hook para manejar cupones desde Redux Store
 * Integrado con RealtimeManager singleton para updates automáticos
 */
export const useCoupons = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(state => state.auth.user)
  const coupons = useAppSelector(state => state.auth.coupons)
  const { active, expired, hasMoreActive, hasMoreExpired, loadingMore } = coupons || {
    active: [],
    expired: [],
    hasMoreActive: false,
    hasMoreExpired: false,
    loadingMore: false
  }

  // 📥 Cargar cupones iniciales (4 activos + 4 expirados para el stack)
  const loadInitialCoupons = useCallback(async () => {
    if (!user?.id) {
      return
    }

    const supabase = createClientBrowser()
    const now = new Date().toISOString()

    try {
      // Cargar solo 4 cupones activos (stack inicial)
      const { data: activeCoupons } = await supabase
        .from('coupons')
        .select(`
          id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
          prizes ( name, image_url )
        `)
        .eq('user_id', user.id)
        .eq('is_redeemed', false)
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(4)

      // Cargar solo 4 cupones expirados para el stack inicial
      const { data: expiredCoupons } = await supabase
        .from('coupons')
        .select(`
          id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
          prizes ( name, image_url )
        `)
        .eq('user_id', user.id)
        .or(`is_redeemed.eq.true,expires_at.lt.${now}`)
        .order('created_at', { ascending: false })
        .limit(4)

      dispatch(setCoupons({
        active: activeCoupons || [],
        expired: expiredCoupons || [],
        hasMoreActive: (activeCoupons?.length || 0) === 4,
        hasMoreExpired: (expiredCoupons?.length || 0) === 4
      }))

    } catch (error) {
      console.error('Error loading initial coupons:', error)
    }
  }, [user?.id, dispatch])

  // 📚 Cargar más cupones expirados (paginación)
  const loadMoreExpiredCoupons = useCallback(async () => {
    if (!user?.id || !hasMoreExpired || loadingMore) return

    dispatch(setLoadingMoreCoupons(true))
    const supabase = createClientBrowser()
    const now = new Date().toISOString()

    try {
      const { data: moreCoupons } = await supabase
        .from('coupons')
        .select(`
          id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
          prizes ( name, image_url )
        `)
        .eq('user_id', user.id)
        .or(`is_redeemed.eq.true,expires_at.lt.${now}`)
        .order('created_at', { ascending: false })
        .range(expired.length, expired.length + 9) // Siguientes 10

      dispatch(appendExpiredCoupons({
        coupons: moreCoupons || [],
        hasMore: (moreCoupons?.length || 0) === 10
      }))

    } catch (error) {
      console.error('Error loading more expired coupons:', error)
      dispatch(setLoadingMoreCoupons(false))
    }
  }, [user?.id, hasMoreExpired, loadingMore, expired.length, dispatch])

  const loadMoreActiveCoupons = useCallback(async () => {
    if (!user?.id || !hasMoreActive || loadingMore) return

    dispatch(setLoadingMoreCoupons(true))
    const supabase = createClientBrowser()
    const now = new Date().toISOString()

    try {
      const { data: moreCoupons } = await supabase
        .from('coupons')
        .select(`
          id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
          prizes ( name, image_url )
        `)
        .eq('user_id', user.id)
        .eq('is_redeemed', false)
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order('created_at', { ascending: false })
        .range(active.length, active.length + 9)

      dispatch(appendActiveCoupons({
        coupons: moreCoupons || [],
        hasMore: (moreCoupons?.length || 0) === 10
      }))

    } catch (error) {
      console.error('Error loading more active coupons:', error)
      dispatch(setLoadingMoreCoupons(false))
    }
  }, [user?.id, hasMoreActive, loadingMore, active.length, dispatch])

  return {
    activeCoupons: active,
    expiredCoupons: expired,
    hasMoreActive,
    hasMoreExpired,
    loadingMore,
    
    // 🔧 Acciones
    loadInitialCoupons,
    loadMoreActiveCoupons,
    loadMoreExpiredCoupons
  }
}
