// Archivo de constantes para configuraciones por defecto
// Este archivo NO importa nada de server, es seguro para client components

export type SystemSettings = {
  company_name: string
  company_logo_url: string
  company_theme_primary: string
  company_theme_secondary: string
  company_contact_email: string
  company_contact_phone: string
  company_address: string
  company_terms_conditions: string
  company_privacy_policy: string
  streak_initial_image?: string
  streak_progress_default?: string
  streak_complete_image?: string
  streak_broken_image?: string      // ← NUEVO: Imagen para racha rota
  streak_expired_image?: string     // ← NUEVO: Imagen para racha expirada (temporada)
  // Configuraciones de rachas
  streak_break_days?: string  // Días sin check-in para romper racha (default: 12)
  streak_expiry_days?: string // Días totales para que expire la racha (default: 90)
  // Configuraciones de check-ins
  checkin_points_daily?: string // Puntos por check-in diario
  max_checkins_per_day?: string // Máximo check-ins por día
  // Configuraciones de analytics
  analytics_checkin_value?: string // Valor monetario por check-in
  analytics_coupon_avg_value?: string // Valor promedio de cupón
  analytics_user_acquisition_cost?: string // Costo de adquisición de usuario
  analytics_spin_cost?: string // Costo por giro de ruleta
  analytics_retention_multiplier?: string // Multiplicador de retención
  analytics_premium_branch_multiplier?: string // Multiplicador sucursal premium
  // Configuraciones SEO y Branding
  seo_title?: string // Título SEO de la aplicación
  seo_description?: string // Descripción SEO para motores de búsqueda
  seo_keywords?: string // Palabras clave SEO
  seo_author?: string // Autor/Empresa para metadatos
  favicon_url?: string // URL del favicon
  apple_touch_icon_url?: string // URL del icono para iOS
  og_image_url?: string // URL de imagen para redes sociales
}

// Configuraciones por defecto (única fuente de verdad)
export const DEFAULT_SETTINGS: SystemSettings = {
  company_name: 'Fuego Rewards',
  company_logo_url: '',
  company_theme_primary: '#D73527', // Rojo del diseño
  company_theme_secondary: '#F97316', // Naranja complementario
  company_contact_email: '',
  company_contact_phone: '',
  company_address: '',
  company_terms_conditions: 'Términos y condiciones por definir...',
  company_privacy_policy: 'Política de privacidad por definir...',
  streak_initial_image: '/images/badge-default.png',
  streak_progress_default: '/images/badge-default.png',
  streak_complete_image: '/images/badge-default.png',
  streak_broken_image: '/images/badge-broken-streak.png',     // ← NUEVO: Imagen para racha rota
  streak_expired_image: '/images/badge-default.png',    // ← NUEVO: Imagen para racha expirada
  // Valores por defecto para rachas
  streak_break_days: '12',   // Romper racha después de 12 días sin check-in
  streak_expiry_days: '90',  // Expirar racha después de 90 días totales
  // Valores por defecto para check-ins
  checkin_points_daily: '10', // Puntos por check-in diario
  max_checkins_per_day: '1',   // Máximo check-ins por día
  // Valores por defecto para analytics
  analytics_checkin_value: '50', // Valor monetario por check-in (MXN)
  analytics_coupon_avg_value: '150', // Valor promedio de cupón (MXN)
  analytics_user_acquisition_cost: '200', // Costo de adquisición de usuario (MXN)
  analytics_spin_cost: '10', // Costo por giro de ruleta (MXN)
  analytics_retention_multiplier: '1.5', // Multiplicador de retención (usuarios retenidos valen 1.5x)
  analytics_premium_branch_multiplier: '1.2', // Multiplicador sucursal premium (20% más valor)
  // Valores por defecto para SEO y Branding
  seo_title: 'Fuego Extremo - Programa de Recompensas',
  seo_description: 'Acumula puntos con cada visita, gira la ruleta y gana increíbles premios. El programa de fidelización más emocionante.',
  seo_keywords: 'recompensas, puntos, ruleta, premios, fidelización, cupones',
  seo_author: '',
  favicon_url: '',
  apple_touch_icon_url: '',
  og_image_url: '',
}
