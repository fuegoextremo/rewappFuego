import { createClientServer } from '@/lib/supabase/server'
import { getSystemSettings } from '@/lib/services/settings'
import { StatsGrid } from '@/components/client/StatsGrid'
import { StreakSection } from '@/components/client/StreakSection'
import { CTAButton } from '@/components/client/CTAButton'
import { RecentActivity } from '@/components/client/RecentActivity'
import Link from 'next/link'

export const revalidate = 0

export default async function ClientHome() {
  const supabase = createClientServer()
  const settings = await getSystemSettings()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return <div className="p-4">Redirigiendo…</div>
  }

  const userId = user.id

  // Obtener datos del usuario
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single()

  // Visitas totales
  const { count: visitsCount } = await supabase
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Giros disponibles
  const { data: spinsRow } = await supabase
    .from('user_spins')
    .select('available_spins')
    .eq('user_id', userId)
    .single()

  // Racha actual
  const { data: currentStreak } = await supabase
    .from('streaks')
    .select('current_count')
    .eq('user_id', userId)
    .single()

  const totalVisits = visitsCount || 0
  const availableSpins = spinsRow?.available_spins || 0
  const streakCount = currentStreak?.current_count || 0

  return (
    <div className="p-4 space-y-6">
      {/* Header con saludo personalizado */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-2xl">🔥</div>
          <h1 className="text-2xl font-bold">{settings.company_name}</h1>
        </div>
        <p className="text-gray-600">
          ¡Visita {settings.company_name}! <strong>Registra tus visitas y participa</strong> en la ruleta para ganar increíbles regalos.
        </p>
      </div>

      {/* Botón CTA principal */}
      <Link href="/client/roulette">
        <CTAButton>
          Registro extremo
        </CTAButton>
      </Link>

      {/* Grid de estadísticas */}
      <StatsGrid visitas={totalVisits} giros={availableSpins} />

      {/* Sección de racha */}
      <StreakSection userId={userId} currentCount={streakCount} />

      {/* Actividad reciente */}
      <RecentActivity userId={userId} />

      {/* Logo del establecimiento */}
      {settings.company_logo_url && (
        <div className="text-center py-6">
          <img 
            src={settings.company_logo_url} 
            alt={settings.company_name}
            className="h-16 mx-auto opacity-60"
          />
        </div>
      )}
    </div>
  )
}
