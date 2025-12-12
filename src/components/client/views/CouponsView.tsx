'use client'
import { useEffect } from 'react'
import { useUser } from '@/store/hooks'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { useCoupons } from '@/hooks/useCoupons'
import SPAAnimatedCouponStack from '@/components/client/SPAAnimatedCouponStack'
import SPAAnimatedExpiredCouponStack from '@/components/client/SPAAnimatedExpiredCouponStack'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { FloatingHeader } from '@/components/client/FloatingHeader'

export default function CouponsView() {
  const user = useUser()
  const { data: systemSettings } = useSystemSettings()
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

  // Obtener el color primario para el fondo degradado
  const primaryColor = systemSettings?.company_theme_primary || '#D73527'

  return (
    <>
      {/* Floating Header - Fixed at top */}
      <FloatingHeader />

      <motion.div 
        className="space-y-0 relative"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Fondo degradado con tamaño fijo - Se mueve con scroll */}
        <div 
          className="absolute top-0 left-0 w-full h-80"
          style={{ background: `linear-gradient(180deg, ${primaryColor} 0%, #FFF 100%)` }}
        />
      
        {/* Sección superior con padding fijo */}
        <div className="pt-20 pb-5 relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center px-8 mb-2"
          >
            <h1 className="text-3xl font-semibold mb-2">Mis Premios</h1>
            <p className="text-sm opacity-90">
              Gestiona tus premios activos y revisa tu historial
            </p>
          </motion.div>
        </div>

      {/* Contenedor principal */}
      <motion.div
        className="mx-4 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-4 space-y-8">
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
              emptySubMessage="¡Sigue participando en la ruleta!"
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
        </div>
      </motion.div>

      {/* Logo del establecimiento */}
      {systemSettings?.company_logo_url && (
        <div className="text-center py-6">
          <div className="w-60 h-60 mx-auto rounded-3xl overflow-hidden flex items-center justify-center p-2">
            <Image 
              src={systemSettings.company_logo_url} 
              alt={systemSettings.company_name || 'Logo de la empresa'}
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
    </>
  )
}
