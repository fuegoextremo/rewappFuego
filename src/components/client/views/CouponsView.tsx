'use client'
import { useState } from 'react'
import { useUser } from '@/store/hooks'
import { useAvailableCoupons, useUsedCoupons } from '@/hooks/queries/useCouponQueries'
import CouponCard from '@/components/client/CouponCard'

export default function CouponsView() {
  const user = useUser()
  const [activeTab, setActiveTab] = useState<'available' | 'used'>('available')

  // 🎯 React Query hooks con cache optimizado
  const { data: availableCoupons = [], isLoading: loadingAvailable } = useAvailableCoupons(user?.id || '')
  const { data: usedCoupons = [], isLoading: loadingUsed } = useUsedCoupons(user?.id || '')

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Inicia sesión para ver tus cupones</p>
      </div>
    )
  }

  const isLoading = activeTab === 'available' ? loadingAvailable : loadingUsed
  const currentCoupons = activeTab === 'available' ? availableCoupons : usedCoupons
  const isEmpty = currentCoupons.length === 0

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* 📱 Header con tabs */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Mis Cupones</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'available'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Disponibles ({availableCoupons.length})
            </button>
            <button
              onClick={() => setActiveTab('used')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'used'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Usados ({usedCoupons.length})
            </button>
          </div>
        </div>

        {/* 📦 Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-24" />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">
                {activeTab === 'available' ? '🎟️' : '📋'}
              </div>
              <p className="text-gray-500 mb-2">
                {activeTab === 'available' 
                  ? 'No tienes cupones disponibles' 
                  : 'No has usado ningún cupón aún'
                }
              </p>
              {activeTab === 'available' && (
                <p className="text-sm text-gray-400">
                  Realiza check-ins para ganar recompensas
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
