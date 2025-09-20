import Image from 'next/image'
import { useSystemSettings } from '@/hooks/use-system-settings'

interface FloatingHeaderProps {
  className?: string
}

export function FloatingHeader({ className = '' }: FloatingHeaderProps) {
  const { data: settings } = useSystemSettings()
  
  const companyName = settings?.company_name || 'RewApp'
  const logoUrl = settings?.company_logo_url

  return (
    <div 
      className={`
        fixed top-2.5 left-1/2 transform -translate-x-1/2 z-50 
        h-[50px] 
        flex items-center gap-3 px-3
        rounded-[18px] 
        backdrop-blur-md
        w-fit
        ${className}
      `}
      style={{
        backgroundColor: 'rgba(72, 72, 72, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* Logo del negocio */}
      <div className="w-[35px] h-[35px] rounded-[13px] overflow-hidden bg-white flex-shrink-0 flex items-center justify-center p-1">
        {logoUrl ? (
          <Image 
            src={logoUrl} 
            alt={companyName}
            width={35}
            height={35}
            className="object-contain w-full h-full"
            priority
          />
        ) : (
          <div className="text-gray-800 text-sm font-bold">
            {companyName.charAt(0)}
          </div>
        )}
      </div>
      
      {/* Nombre del negocio */}
      <div className="whitespace-nowrap">
        <span className="text-white font-semibold text-sm">
          RewApp {companyName}
        </span>
      </div>
    </div>
  )
}