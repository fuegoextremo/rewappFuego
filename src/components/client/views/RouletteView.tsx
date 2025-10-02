'use client'

import { useUser, useSettings, useAvailableSpins } from '@/store/hooks'
import { useSystemSettings } from "@/hooks/use-system-settings";
import { useRoulettePrizes, getRarityFromWeight } from '@/hooks/queries/useRouletteQueries'
import SpinButton from '@/app/client/roulette/spin-button'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FloatingHeader } from '@/components/client/FloatingHeader'
import { FerrisWheel } from "lucide-react";

export default function RouletteView() {
  const user = useUser()
  const settings = useSettings()
  const { data: systemSettings } = useSystemSettings()
  const { data: prizes, isLoading: prizesLoading } = useRoulettePrizes()
  
  // 🔄 MIGRATED: Use new userData hook instead of user.available_spins
  const availableSpins = useAvailableSpins()

  // ✨ Loading inteligente - solo necesitamos verificar prizes
  const hasUser = !!user
  // const hasSettings = !!settings // No se usa actualmente
  const isActuallyLoading = prizesLoading

  if (!hasUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inicia sesión para jugar la ruleta</p>
      </div>
    )
  }

  // 🎨 Loading suave con Framer Motion (igual que StreakSection)
  if (isActuallyLoading) {
    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* 🎨 Placeholder bonito sin skeleton molesto */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/2 mx-auto"></div>
            <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto"></div>
            <div className="text-gray-400">Cargando ruleta...</div>
          </div>
        </div>
        <div className="space-y-3 px-4">
          <div className="h-6 bg-gray-100 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  // ✨ Datos desde Redux - migrado a userData
  const hasSpins = availableSpins > 0
  const primaryColor = systemSettings?.company_theme_primary || '#3B82F6'

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
        <div className="relative">
          {/* 🎰 Título de ruleta dentro del degradado */}
          <motion.div
            className="pt-24 mb-6 relative z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-3xl font-semibold mb-4 px-8 text-center">¡Gira la Ruleta!</h2>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">Tienes</span>
                <FerrisWheel size={26} className="" />
                <div 
                  className=" flex gap-1 px-2 py-2 rounded-xl text-2xl font-bold bg-white"
                  style={{ color: primaryColor }}
                >
                  {availableSpins}
                </div>
                <span className="text-2xl">oportunidades</span>
              </div>
                            <p className='px-8 text-center text-sm'>Cuando ganas giros de ruleta 😄, puedes utilizar cada oportunidad para ganar alguno de las recompensas disponibles.</p>

              <SpinButton disabled={!hasSpins} />
              
              {!hasSpins && (
                <div className="text-white/80 mt-4">
                  <p className="text-sm">No tienes giros disponibles</p>
                  <p className="text-xs mt-1">Realiza check-ins para ganar giros</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Contenedor principal con sombra hacia arriba - igual que HomeView */}
        <div
          className="space-y-6"
        >
          <div className="p-6">
            {/* 🏆 Lista de premios disponibles */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
        <h3 className="text-lg font-semibold text-gray-900">🎁 Premios Disponibles</h3>
        
        {prizes && prizes.length > 0 ? (
          <div className="space-y-3">
            {prizes.map((prize) => {
              const rarity = getRarityFromWeight(prize.weight || 1)
              return (
                <div
                  key={prize.id}
                  className="rounded-2xl bg-gray-100 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{prize.name}</h4>
                      {prize.description && (
                        <p className="text-sm text-gray-600 mt-1">{prize.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${rarity.color}`}>
                          {rarity.emoji} {rarity.label}
                        </span>
                        {/*prize.validity_days && (
                          <span className="text-xs text-gray-500">
                            Válido por {prize.validity_days} días
                          </span>
                        )*/}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      {prize.inventory_count ? `${prize.inventory_count} disponibles` : 'Stock ilimitado'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay premios disponibles actualmente</p>
          </div>
        )}
        
        {/* 💡 Tip informativo 
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>💡 Tip:</strong> Los premios más raros tienen menor probabilidad, pero ¡siempre hay una oportunidad de ganar!
          </p>
        </div>*/}
              </motion.div>
            </div>
          </div>

        {/* Logo del establecimiento */}
        {settings?.company_logo_url && (
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-60 h-60 mx-auto rounded-3xl overflow-hidden flex items-center justify-center p-2">
              <Image 
                src={settings.company_logo_url} 
                alt={settings.company_name || 'Logo de la empresa'}
                width={160}
                height={160}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </motion.div>
        )}

        {/* Banner inferior - Sin padding para pegarlo al bottom nav */}
        <motion.div 
          className="w-full"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Image 
            src="/images/banner_inferior.png"
            alt="Banner inferior"
            width={400}
            height={200}
            className="w-full h-auto object-cover"
            priority={false}
          />
        </motion.div>
      </motion.div>
    </>
  )
}
