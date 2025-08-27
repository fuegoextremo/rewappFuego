'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/client', label: 'Inicio', icon: '🏠' },
  { href: '/client/roulette', label: 'Ruleta', icon: '🎡' },
  { href: '/client/checkin', label: 'Check-in', icon: '🔥' }, // placeholder icon
  { href: '/client/coupons', label: 'Cupones', icon: '🎟️' },
  { href: '/client/profile', label: 'Perfil', icon: '👤' },
]

export function BottomNav({ onCheckinClick }: { onCheckinClick?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto grid max-w-sm grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href
          const isCheckin = it.href === '/client/checkin'
          return (
            <li key={it.href}>
              {isCheckin && onCheckinClick ? (
                <button
                  type="button"
                  onClick={onCheckinClick}
                  className="w-full flex flex-col items-center py-2 text-xs focus:outline-none"
                  aria-label="Mostrar QR de check-in"
                >
                  <span className="text-base">{it.icon}</span>
                  <span className="text-gray-700">{it.label}</span>
                </button>
              ) : (
                <Link
                  href={it.href}
                  prefetch
                  className="flex flex-col items-center py-2 text-xs"
                >
                  <span className={`text-base ${active ? 'scale-110' : ''}`}>
                    {it.icon}
                  </span>
                  <span className={active ? 'font-semibold' : 'text-gray-500'}>
                    {it.label}
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}