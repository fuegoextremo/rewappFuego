import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from "@/types/database"

export interface SEOSettings {
  seo_title: string
  seo_description: string
  seo_keywords: string
  seo_author: string
  favicon_url: string
  apple_touch_icon_url: string
  og_image_url: string
  company_logo_url: string
  company_name: string
}

const DEFAULT_SEO: SEOSettings = {
  seo_title: 'Fuego Extremo - Programa de Recompensas',
  seo_description: 'Acumula puntos con cada visita, gira la ruleta y gana increíbles premios. El programa de fidelización más emocionante.',
  seo_keywords: 'recompensas, puntos, ruleta, premios, fidelización, cupones',
  seo_author: 'Fuego Extremo',
  favicon_url: '',
  apple_touch_icon_url: '',
  og_image_url: '',
  company_logo_url: '',
  company_name: 'Fuego Extremo',
}

/**
 * Obtiene los settings de SEO para generar metadatos dinámicos
 * Esta función es segura para llamar sin autenticación ya que los datos de SEO son públicos
 */
export async function getSEOSettings(): Promise<SEOSettings> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'seo_title',
        'seo_description', 
        'seo_keywords',
        'seo_author',
        'favicon_url',
        'apple_touch_icon_url',
        'og_image_url',
        'company_logo_url',
        'company_name'
      ])
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching SEO settings:', error)
      return DEFAULT_SEO
    }

    // Convertir array a objeto
    const settings = data?.reduce((acc, setting) => {
      acc[setting.key as keyof SEOSettings] = setting.value || ''
      return acc
    }, {} as Partial<SEOSettings>) || {}

    // Merge con defaults
    return {
      ...DEFAULT_SEO,
      ...settings,
    }
  } catch (error) {
    console.error('Error in getSEOSettings:', error)
    return DEFAULT_SEO
  }
}
