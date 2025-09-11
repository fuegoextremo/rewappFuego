'use client'
import { useEffect } from 'react'
import { useUser, useSettings } from '@/store/hooks'
import { useCoupons } from '@/hooks/useCoupons'
import SPAAnimatedCouponStack from '@/components/client/SPAAnimatedCouponStack'
import SPAAnimatedExpiredCouponStack from '@/components/client/SPAAnimatedExpiredCouponStack'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function CouponsView() {
  const user = useUser()
  const settings = useSettings()
  const { 
    activeCoupons, 
    expiredCoupons, 
    hasMoreActive, 
    hasMoreExpired,
    loadingMore,
    totalActive,      // 🆕 Obtener totales
    totalExpired,     // 🆕 Obtener totales
    loadInitialCoupons,
    loadMoreActiveCoupons,
    loadMoreExpiredCoupons
  } = useCoupons()  // Cargar cupones al montar el componente
  useEffect(() => {
    if (user?.id) {
      loadInitialCoupons()
    }
  }, [user?.id, loadInitialCoupons])

  return (
    <motion.div 
      className="space-y-8 max-w-md mx-auto w-full overflow-hidden px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
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
          total={totalActive}          // 🆕 Pasar total
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
          total={totalExpired}         // 🆕 Pasar total
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

      {/* Logo del establecimiento */}
      {settings?.company_logo_url && (
        <div className="text-center py-6">
          <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden flex items-center justify-center p-2">
            <Image 
              src={settings.company_logo_url} 
              alt={settings.company_name || 'Logo de la empresa'}
              width={160}
              height={160}
              className="object-contain w-full h-full"
              priority
            />
          </div>
        </div>
      )}

      {/* Banner inferior - Sin padding para pegarlo al bottom nav */}
      <div className="w-full">
        <Image 
          src="/images/banner_inferior.png"
          alt="Banner inferior"
          width={400}
          height={200}
          className="w-full h-auto object-cover"
          priority={false}
        />
      </div>
    </motion.div>
  )
}
