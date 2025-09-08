'use client'
import { useCurrentView, useAppDispatch } from '@/store/hooks'
import { useSettings } from '@/store/hooks'
import { setCurrentView } from '@/store/slices/uiSlice'
import { Home, FerrisWheel, QrCode, Ticket, User } from 'lucide-react'

const items = [
  { view: 'home', label: 'Inicio', icon: Home },
  { view: 'roulette', label: 'Ruleta', icon: FerrisWheel },
  { view: 'checkin', label: 'QR', icon: QrCode },
  { view: 'coupons', label: 'Cupones', icon: Ticket },
  { view: 'profile', label: 'Perfil', icon: User },
] as const

export function BottomNav({ onCheckinClick }: { onCheckinClick?: () => void }) {
  const dispatch = useAppDispatch()
  const currentView = useCurrentView()
  const settings = useSettings()
  
  const primaryColor = settings.company_theme_primary || '#D73527'
  
  
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto grid  grid-cols-5">
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
                    <item.icon className="w-5 h-5 text-white antialiased" style={{ shapeRendering: 'geometricPrecision' }} />
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => dispatch(setCurrentView(item.view as 'home' | 'profile' | 'coupons' | 'roulette'))}
                  className="w-full flex flex-col items-center py-3 text-xs focus:outline-none"
                >
                  <item.icon className={`w-5 h-5 ${active ? 'scale-110 text-blue-600' : 'text-gray-700'} transition-all antialiased`} style={{ shapeRendering: 'geometricPrecision' }} />
                  <span className={`${active ? 'text-blue-600 font-medium' : 'text-gray-700'} transition-colors`}>
                    {item.label}
                  </span>
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}