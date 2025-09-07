'use client'
import { useCurrentView, useAppDispatch } from '@/store/hooks'
import { setCurrentView } from '@/store/slices/uiSlice'

const items = [
  { view: 'home', label: 'Inicio', icon: '🏠' },
  { view: 'roulette', label: 'Ruleta', icon: '🎡' },
  { view: 'checkin', label: 'Check-in', icon: '🔥' }, // placeholder for checkin button
  { view: 'coupons', label: 'Cupones', icon: '🎟️' },
  { view: 'profile', label: 'Perfil', icon: '👤' },
] as const

export function BottomNav({ onCheckinClick }: { onCheckinClick?: () => void }) {
  const dispatch = useAppDispatch()
  const currentView = useCurrentView()
  
  
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto grid max-w-sm grid-cols-5">
        {items.map((item) => {
          const active = currentView === item.view
          const isCheckin = item.view === 'checkin'
          
          return (
            <li key={item.view}>
              {isCheckin && onCheckinClick ? (
                <button
                  type="button"
                  onClick={onCheckinClick}
                  className="w-full flex flex-col items-center py-2 text-xs focus:outline-none"
                  aria-label="Mostrar QR de check-in"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-gray-700">{item.label}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => dispatch(setCurrentView(item.view as 'home' | 'profile' | 'coupons' | 'roulette'))}
                  className="w-full flex flex-col items-center py-2 text-xs focus:outline-none"
                >
                  <span className={`text-base ${active ? 'scale-110' : ''} transition-transform`}>
                    {item.icon}
                  </span>
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