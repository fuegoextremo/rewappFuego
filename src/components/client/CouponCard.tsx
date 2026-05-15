'use client'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { useModal } from '@/components/providers/ModalProvider'

type CouponRow = {
  id: string
  unique_code: string | null
  expires_at: string | null
  is_redeemed: boolean | null
  redeemed_at: string | null
  source: string | null
  created_at: string | null
  prizes: { name: string; image_url: string | null; description: string | null } | null
}

interface CouponCardProps {
  coupon: CouponRow
  isInStack?: boolean
  forceGrayStyle?: boolean // Nuevo prop para cupones caducados
}

// 🎨 Función para generar variantes de color basadas en un color base
const getCouponColorVariant = (couponId: string, baseColor: string): string => {
  // Convertir ID a número estable usando hash simple
  const hash = couponId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Convertir color hex a HSL para manipular más fácilmente
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number;
    const l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    
    return [h * 360, s * 100, l * 100];
  };
  
  // Convertir HSL a hex
  const hslToHex = (h: number, s: number, l: number) => {
    h /= 360; s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c/2;
    let r, g, b;
    
    if (0 <= h && h < 1/6) { r = c; g = x; b = 0; }
    else if (1/6 <= h && h < 2/6) { r = x; g = c; b = 0; }
    else if (2/6 <= h && h < 3/6) { r = 0; g = c; b = x; }
    else if (3/6 <= h && h < 4/6) { r = 0; g = x; b = c; }
    else if (4/6 <= h && h < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  try {
    const [baseH, baseS, baseL] = hexToHsl(baseColor);
    
    // Generar variaciones usando el hash con rangos más conservadores
    const hueVariation = ((hash % 40) - 20); // ±20 grados de matiz (más sutil)
    const satVariation = ((hash % 20) - 10); // ±10% de saturación (más conservador)
    
    // Aplicar variaciones con límites seguros para legibilidad
    const newH = (baseH + hueVariation + 360) % 360;
    const newS = Math.max(40, Math.min(80, baseS + satVariation)); // Entre 40-80% (colores vibrantes pero no excesivos)
    const newL = Math.max(35, Math.min(65, baseL)); // Entre 35-65% (siempre oscuros para texto blanco)
    
    return hslToHex(newH, newS, newL);
  } catch (error) {
    // Fallback si hay error en la conversión
    console.warn('Error generando variante de color:', error);
    return baseColor;
  }
}

// 🔍 Función para determinar si usar texto blanco o negro
const getTextColor = (backgroundColor: string): string => {
  // Convertir hex a RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calcular luminancia relativa (WCAG 2.1)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Si la luminancia es alta (color claro), usar texto negro; sino blanco
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export default function CouponCard({ coupon, isInStack = false, forceGrayStyle = false }: CouponCardProps) {
  const { openRedeemModal } = useModal()
  const { data: settings } = useSystemSettings()
  
  // 🎨 Generar variante del color base del sistema
  const baseColor = settings?.company_theme_primary || '#D73527' // Color base del sistema
  const dynamicColor = getCouponColorVariant(coupon.id, baseColor)
  // 🎯 Si forceGrayStyle está activo, usar escala de grises
  const primaryColor = forceGrayStyle ? '#6b7280' : dynamicColor
  
  // � Calcular color de texto automáticamente para máximo contraste
  const textColor = getTextColor(primaryColor)
  
  // �🐛 Debug temporal - puedes quitar esto después
  //console.log(`Cupón ${coupon.unique_code}: Variante ${primaryColor} del base ${baseColor} (ID: ${coupon.id.slice(-8)})`)
  
  const now = Date.now()
  const active = !coupon.is_redeemed && (!coupon.expires_at || new Date(coupon.expires_at).getTime() >= now)

  const dt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
  const exp = coupon.expires_at ? dt.format(new Date(coupon.expires_at)) : 'Sin caducidad'

  return (
    <div 
      className="relative"
      style={{
        // 🎫 Sombra en el contenedor wrapper
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.11))',
      }}
    >
      <article 
        className={`relative ticket-shape overflow-hidden transition-all duration-300 select-none min-h-[200px] ${
          active 
            ? '' // Sin clases de texto por defecto, usar el color calculado
            : 'bg-white text-gray-800'
        }`}
        style={{
          // 🎨 Fondo sólido para cupones activos (sin transparencias)
          ...(active && {
            backgroundColor: primaryColor,
            color: textColor
          }),
          // 🎫 TEMPORALMENTE COMENTADO: Mask para crear círculos laterales perforados
          // 🍎 Verificando si causa problemas en iPhone
          /* 
          WebkitMask: `
            radial-gradient(circle 25px at 0px 50%, transparent 25px, black 25px),
            radial-gradient(circle 25px at 100% 50%, transparent 25px, black 25px)
          `,
          mask: `
            radial-gradient(circle 25px at 0px 50%, transparent 25px, black 25px),
            radial-gradient(circle 25px at 100% 50%, transparent 25px, black 25px)
          `,
          WebkitMaskComposite: 'intersect',
          maskComposite: 'intersect'
          */
      }}
    >
      <div className="px-9 py-5 relative h-full flex flex-col justify-between">        
        {/* Sección superior: información del premio */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="min-w-0">
            <p 
              className="text-xs uppercase tracking-wide font-medium"
              style={{ 
                opacity: active ? 0.8 : 0.7,
                color: active ? textColor : undefined 
              }}
            >
              Premio válido
            </p>
            <h4 
              className="font-bold text-lg truncate mt-1 pb-1"
              style={{ 
                color: active ? textColor : '#1f2937' 
              }}
            >
              {coupon.prizes?.name ?? 'Premio'}
            </h4>
            {coupon.prizes?.description && (
              <p
                className="text-xs mt-1 line-clamp-2"
                style={{
                  opacity: active ? 0.85 : 0.75,
                  color: active ? textColor : '#374151'
                }}
              >
                {coupon.prizes.description}
              </p>
            )}
            <p 
              className="text-xs mt-1"
              style={{ 
                opacity: active ? 0.8 : 1,
                color: active ? textColor : '#6b7280'
              }}
            >
              Válido hasta {exp}
            </p>
          </div>
          {!active && (
            <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium shrink-0">
              {coupon.is_redeemed ? '✓ Usado' : '⚠ Vencido'}
            </span>
          )}
        </div>

        {/* Línea divisoria punteada - ahora auto-centrada */}
        <div className={`flex-1 flex items-center my-3 py-2`}>
          <div 
            className="w-full border-t-2 border-dashed"
            style={{
              borderColor: active ? (textColor + '60') : '#d1d5db'
            }}
          ></div>
        </div>

        {/* Sección inferior: código y acción */}
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div 
              className="text-[12px]"
              style={{ 
                color: active ? textColor : '#6b7280',
                opacity: active ? 0.8 : 1
              }}
            >
              Cupón
            </div>
            <div 
              className="font-mono text-sm font-bold tracking-wider"
              style={{ 
                color: active ? textColor : '#111827'
              }}
            >
              {coupon.unique_code || 'SIN-CÓDIGO'}
            </div>
          </div>
          {active && !isInStack && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                openRedeemModal(coupon.id)
              }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm transition-all duration-200 shadow-md hover:opacity-90 hover:scale-105 active:scale-95 z-10 relative"
              style={{ 
                backgroundColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.20)',
                color: textColor,
                backdropFilter: 'blur(10px)'
              }}
            >
              Reclamar
            </button>
          )}
          {/* Mostrar solo texto cuando está en stack */}
          {active && isInStack && (
            <div className="text-xs text-white-400">
              Toca para ver
            </div>
          )}
        </div>
      </div>
    </article>
    </div>
  )
}