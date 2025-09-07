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
  // Configuraciones de rachas
  streak_break_days?: string  // Días sin check-in para romper racha (default: 12)
  streak_expiry_days?: string // Días totales para que expire la racha (default: 90)
  // Configuraciones de check-ins
  checkin_points_daily?: string // Puntos por check-in diario
  max_checkins_per_day?: string // Máximo check-ins por día
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
  streak_initial_image: '/images/streak-start-default.png',
  streak_progress_default: '/images/streak-start-default.png',
  streak_complete_image: '/images/streak-complete-default.png',
  // Valores por defecto para rachas
  streak_break_days: '12',   // Romper racha después de 12 días sin check-in
  streak_expiry_days: '90',  // Expirar racha después de 90 días totales
  // Valores por defecto para check-ins
  checkin_points_daily: '10', // Puntos por check-in diario
  max_checkins_per_day: '1'   // Máximo check-ins por día
}
