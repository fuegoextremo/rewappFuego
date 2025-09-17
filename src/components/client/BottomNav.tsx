'use client'
import { useCurrentView, useAppDispatch, useUser } from '@/store/hooks'
import { useSettings } from '@/store/hooks'
import { setCurrentView } from '@/store/slices/uiSlice'
import { useBlockedDispatch } from '@/hooks/useBlockedDispatch'
import { Home, FerrisWheel, QrCode, Ticket, User } from 'lucide-react'
import { useEffect } from 'react'

const items = [
  { view: 'home', label: 'Inicio', icon: Home },
  { view: 'roulette', label: 'Ruleta', icon: FerrisWheel },
  { view: 'checkin', label: 'QR', icon: QrCode },
  { view: 'coupons', label: 'Cupones', icon: Ticket },
  { view: 'profile', label: 'Perfil', icon: User },
] as const

export function BottomNav({ onCheckinClick }: { onCheckinClick?: () => void }) {
  const dispatch = useAppDispatch()
  const blockedDispatch = useBlockedDispatch()
  const currentView = useCurrentView()
  const settings = useSettings()
  const user = useUser()
  
  // Crear dispatch wrapper que respeta el bloqueo
  const safeDispatch = blockedDispatch(dispatch)
  
  const primaryColor = settings.company_theme_primary || '#D73527'
  const availableSpins = user?.available_spins ?? 0
  
  // 📜 Auto-scroll al top cuando cambia de sección
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentView])
  
  
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 px-4 pb-6">
      <div className="mx-auto max-w-md bg-white rounded-2xl shadow-lg border border-gray-100">
        <ul className="grid grid-cols-5 py-2">
          {items.map((item) => {
            const active = currentView === item.view
            const isCheckin = item.view === 'checkin'
            
            return (
              <li key={item.view}>
                {isCheckin && onCheckinClick ? (
                  <button
                    type="button"
                    onClick={onCheckinClick}
                    className="w-full flex flex-col items-center py-3 text-xs focus:outline-none"
                    aria-label="Mostrar QR de check-in"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <item.icon className="w-6 h-6 text-white antialiased" style={{ shapeRendering: 'geometricPrecision' }} />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => safeDispatch(setCurrentView(item.view as 'home' | 'profile' | 'coupons' | 'roulette'))}
                    className="w-full flex flex-col items-center py-3 text-xs focus:outline-none"
                  >
                    <div className="relative">
                      <item.icon 
                        className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-all antialiased`} 
                        style={{ 
                          shapeRendering: 'geometricPrecision',
                          color: active ? primaryColor : '#374151'
                        }} 
                      />
                      {/* Badge de giros disponibles solo para ruleta */}
                      {item.view === 'roulette' && availableSpins > 0 && (
                        <div 
                          className="absolute -top-1 -right-1 text-white text-[10px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-bold shadow-lg"
                          style={{ 
                            backgroundColor: primaryColor,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        >
                          {availableSpins > 99 ? '99+' : availableSpins}
                        </div>
                      )}
                    </div>
                    <span 
                      className={`mt-1 ${active ? 'font-medium' : ''} transition-colors`}
                      style={{ color: active ? primaryColor : '#374151' }}
                    >
                      {item.label}
                    </span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}