'use client'

import { useSystemSettings } from '@/hooks/use-system-settings'

type Props = {
  onClick?: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  loading?: boolean
}

export function CTAButton({ 
  onClick, 
  children, 
  size = 'lg',
  variant = 'primary',
  disabled = false,
  loading = false
}: Props) {
  const { settings } = useSystemSettings()
  
  const primaryColor = settings?.company_theme_primary || '#D73527'
  const secondaryColor = settings?.company_theme_secondary || '#F97316'

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const backgroundColor = variant === 'primary' ? primaryColor : secondaryColor

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full rounded-2xl font-bold text-white
        transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed
        hover:scale-[0.98] active:scale-95
        shadow-lg hover:shadow-xl
        ${sizeClasses[size]}
      `}
      style={{ backgroundColor }}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Cargando...
        </div>
      ) : (
        children
      )}
    </button>
  )
}
