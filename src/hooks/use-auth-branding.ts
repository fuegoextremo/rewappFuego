/**
 * 🎨 AUTH BRANDING HOOK
 * Hook para obtener configuraciones de branding específicas para autenticación
 * Incluye logo, colores, nombre de empresa y documentos legales
 */

import { useSystemSettings } from './use-system-settings'

export interface AuthBranding {
  companyName: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  termsContent: string
  privacyContent: string
  isLoading: boolean
}

export function useAuthBranding(): AuthBranding {
  const { data: settings, isLoading } = useSystemSettings()

  return {
    companyName: settings?.company_name || 'RewardApp',
    logoUrl: settings?.company_logo_url || '',
    primaryColor: settings?.company_theme_primary || '#D73527',
    secondaryColor: settings?.company_theme_secondary || '#F97316',
    termsContent: settings?.company_terms_conditions || 'Términos y condiciones por definir...',
    privacyContent: settings?.company_privacy_policy || 'Política de privacidad por definir...',
    isLoading
  }
}
