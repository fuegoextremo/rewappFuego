'use client'
import { useEffect } from 'react'
import { useUser } from '@/store/hooks'
import { useCoupons } from '@/hooks/useCoupons'
import SPAAnimatedCouponStack from '@/components/client/SPAAnimatedCouponStack'
import SPAAnimatedExpiredCouponStack from '@/components/client/SPAAnimatedExpiredCouponStack'
import { motion } from 'framer-motion'

export default function CouponsView() {
  const user = useUser()
  const {
    activeCoupons,
    expiredCoupons,
    hasMoreActive,
    hasMoreExpired,
    loadingMore,
    loadInitialCoupons,
    loadMoreActiveCoupons,
    loadMoreExpiredCoupons
  } = useCoupons()

  // Cargar cupones al montar el componente
  useEffect(() => {
    if (user?.id) {
      loadInitialCoupons()
    }
  }, [user?.id, loadInitialCoupons])

  return (
    <motion.div 
      className="space-y-8 max-w-md mx-auto w-full overflow-hidden p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Cupones</h1>
        <p className="text-gray-600 text-sm">
          Gestiona tus cupones activos y revisa tu historial
        </p>
      </motion.div>

      {/* Cupones Activos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SPAAnimatedCouponStack 
          coupons={activeCoupons}
          title="Cupones Activos"
          emptyMessage="Aún no tienes cupones activos"
          emptySubMessage="¡Sigue participando en la ruleta! 🎡"
          hasMore={hasMoreActive}
          loading={loadingMore}
          onLoadMore={loadMoreActiveCoupons}
        />
      </motion.div>

      {/* Cupones Expirados/Usados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SPAAnimatedExpiredCouponStack 
          coupons={expiredCoupons}
          title="Historial"
          emptyMessage="No tienes cupones en el historial"
          emptySubMessage="Los cupones usados aparecerán aquí 📋"
          hasMore={hasMoreExpired}
          loading={loadingMore}
          onLoadMore={loadMoreExpiredCoupons}
        />
      </motion.div>

      {/* Estado de carga inicial */}
      {!user && (
        <motion.div
          className="flex items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span>Cargando cupones...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
