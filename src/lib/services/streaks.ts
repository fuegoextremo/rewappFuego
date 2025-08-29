// src/lib/services/streaks.ts
import { createClientServer } from "@/lib/supabase/server"
import { createClientBrowser } from "@/lib/supabase/client"
import { getSystemSettings, getSystemSettingsClient, type SystemSettings } from "./settings"
import { type SystemSettings as HookSystemSettings } from "@/hooks/use-system-settings"

export type StreakStage = {
  image: string
  stage: string
  progress: number
  nextGoal?: number
  nextReward?: string
  canRestart?: boolean
  isCompleted?: boolean
}

export type StreakPrize = {
  id: string
  name: string
  description: string | null
  streak_threshold: number | null
  image_url: string | null
  validity_days: number | null
}

// Fallback images
const FALLBACK_IMAGES = {
  streak_initial: "🔥", // Emoji como fallback
  streak_progress: "🚀", 
  streak_complete: "🏆"
}

// Para uso en Server Components
export async function getStreakStage(userId: string, currentCount: number): Promise<StreakStage> {
  const supabase = createClientServer()
  const settings = await getSystemSettings()
  
  // Obtener premios de racha ordenados
  const { data: streakPrizes, error } = await supabase
    .from('prizes')
    .select('id, name, description, streak_threshold, image_url, validity_days')
    .eq('type', 'streak')
    .eq('is_active', true)
    .order('streak_threshold', { ascending: true })

  if (error) {
    console.error('Error obteniendo premios de racha:', error)
    return getDefaultStreakStage(currentCount)
  }

  return calculateStreakStage(currentCount, streakPrizes, settings)
}

// Para uso en Client Components
export async function getStreakStageClient(userId: string, currentCount: number): Promise<StreakStage> {
  const supabase = createClientBrowser()
  
  // Obtener configuraciones directamente
  const { data: settingsData, error: settingsError } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('is_active', true)

  const settings = settingsError ? {} : settingsData.reduce((acc, { key, value }) => {
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  const { data: streakPrizes, error } = await supabase
    .from('prizes')
    .select('id, name, description, streak_threshold, image_url, validity_days')
    .eq('type', 'streak')
    .eq('is_active', true)
    .order('streak_threshold', { ascending: true })

  if (error) {
    console.error('Error obteniendo premios de racha:', error)
    return getDefaultStreakStage(currentCount)
  }

  return calculateStreakStageSimple(currentCount, streakPrizes, settings)
}

// Versión simplificada para cliente
function calculateStreakStageSimple(
  currentCount: number, 
  streakPrizes: StreakPrize[], 
  settings: Record<string, string>
): StreakStage {
  
  // Filtrar premios válidos (con threshold definido)
  const validPrizes = streakPrizes.filter(p => p.streak_threshold && p.streak_threshold > 0)
  
  // Caso 1: Sin visitas - Imagen motivacional inicial
  if (currentCount === 0) {
    const firstThreshold = validPrizes[0]?.streak_threshold || 5
    return {
      image: settings.streak_initial_image || FALLBACK_IMAGES.streak_initial,
      stage: "¡Empieza tu primera visita!",
      progress: 0,
      nextGoal: firstThreshold,
      nextReward: validPrizes[0]?.name || "Premio sorpresa"
    }
  }

  // Caso 2: Encontrar la etapa actual y siguiente
  const currentThreshold = validPrizes.findLast(p => p.streak_threshold! <= currentCount)
  const nextThreshold = validPrizes.find(p => p.streak_threshold! > currentCount)

  // Caso 3: En progreso hacia siguiente meta
  if (nextThreshold) {
    const baseProgress = currentThreshold?.streak_threshold || 0
    const progressRange = nextThreshold.streak_threshold! - baseProgress
    const currentProgress = currentCount - baseProgress
    const progressPercentage = (currentProgress / progressRange) * 100

    return {
      image: currentThreshold?.image_url || 
             settings.streak_progress_default || 
             FALLBACK_IMAGES.streak_progress,
      stage: `Racha activa: ${currentCount} visitas`,
      progress: Math.min(progressPercentage, 100),
      nextGoal: nextThreshold.streak_threshold!,
      nextReward: nextThreshold.name
    }
  }

  // Caso 4: Completó todas las rachas configuradas
  return {
    image: settings.streak_complete_image || FALLBACK_IMAGES.streak_complete,
    stage: "¡Racha máxima completada!",
    progress: 100,
    canRestart: true,
    isCompleted: true
  }
}

// Lógica principal del sistema de rachas
function calculateStreakStage(
  currentCount: number, 
  streakPrizes: StreakPrize[], 
  settings: SystemSettings
): StreakStage {
  
  // Filtrar premios válidos (con threshold definido)
  const validPrizes = streakPrizes.filter(p => p.streak_threshold && p.streak_threshold > 0)
  
  // Caso 1: Sin visitas - Imagen motivacional inicial
  if (currentCount === 0) {
    const firstThreshold = validPrizes[0]?.streak_threshold || 5
    return {
      image: settings.streak_initial_image || FALLBACK_IMAGES.streak_initial,
      stage: "¡Empieza tu primera visita!",
      progress: 0,
      nextGoal: firstThreshold,
      nextReward: validPrizes[0]?.name || "Premio sorpresa"
    }
  }

  // Caso 2: Encontrar la etapa actual y siguiente
  const currentThreshold = validPrizes.findLast(p => p.streak_threshold! <= currentCount)
  const nextThreshold = validPrizes.find(p => p.streak_threshold! > currentCount)

  // Caso 3: En progreso hacia siguiente meta
  if (nextThreshold) {
    const baseProgress = currentThreshold?.streak_threshold || 0
    const progressRange = nextThreshold.streak_threshold! - baseProgress
    const currentProgress = currentCount - baseProgress
    const progressPercentage = (currentProgress / progressRange) * 100

    return {
      image: currentThreshold?.image_url || 
             settings.streak_progress_default || 
             FALLBACK_IMAGES.streak_progress,
      stage: `Racha activa: ${currentCount} visitas`,
      progress: Math.min(progressPercentage, 100),
      nextGoal: nextThreshold.streak_threshold!,
      nextReward: nextThreshold.name
    }
  }

  // Caso 4: Completó todas las rachas configuradas
  return {
    image: settings.streak_complete_image || FALLBACK_IMAGES.streak_complete,
    stage: "¡Racha máxima completada!",
    progress: 100,
    canRestart: true,
    isCompleted: true
  }
}

// Fallback cuando hay errores
function getDefaultStreakStage(currentCount: number): StreakStage {
  if (currentCount === 0) {
    return {
      image: FALLBACK_IMAGES.streak_initial,
      stage: "¡Empieza tu primera visita!",
      progress: 0,
      nextGoal: 5
    }
  }

  return {
    image: FALLBACK_IMAGES.streak_progress,
    stage: `Racha activa: ${currentCount} visitas`,
    progress: (currentCount % 20) * 5, // Progreso estimado
    nextGoal: Math.ceil(currentCount / 5) * 5
  }
}
