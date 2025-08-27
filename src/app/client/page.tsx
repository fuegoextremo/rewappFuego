import { createClientServer } from '@/lib/supabase/server'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'

export const revalidate = 0

export default async function ClientHome() {
  const supabase = createClientServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    // middleware ya redirige; esto es por si renderiza estático
    return <div className="p-4">Redirigiendo…</div>
  }

  const userId = user.id

  // Visitas totales (solo contamos, no traemos filas)
  const { count: visitsCount } = await supabase
    .from('check_ins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Giros disponibles
  const { data: spinsRow } = await supabase
    .from('user_spins')
    .select('available_spins')
    .eq('user_id', userId)
    .maybeSingle()

  // Racha
  const { data: streak } = await supabase
    .from('streaks')
    .select('current_count, last_check_in, expires_at, is_completed')
    .eq('user_id', userId)
    .maybeSingle()

  // Actividad reciente (últimos 5 check-ins)
  const { data: recent } = await supabase
    .from('check_ins')
    .select('created_at, branch_id, spins_earned')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  const visits = visitsCount ?? 0
  const spins = spinsRow?.available_spins ?? 0
  const streakDays = streak?.current_count ?? 0

  return (
    <section className="px-4 py-4 space-y-6">
      {/* Hero + CTA principal */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">¡Visita Fuego Extremo!</h2>
        <p className="text-sm text-gray-600">
          Registra tus visitas y participa en la ruleta para ganar increíbles regalos.
        </p>
        <a
          href="/client/checkin"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-white font-medium shadow active:translate-y-[1px]"
        >
          Registro extremo
        </a>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Completaste"
          value={visits}
          suffix="Visitas"
          theme="dark"
        />
        <StatCard
          title="Tienes"
          value={spins}
          suffix="Giros de ruleta"
          theme="light"
        />
      </div>

      {/* Racha */}
      <div className="rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Racha {streakDays > 0 ? 'activa' : 'inactiva'}</h3>
          <span className="text-sm text-gray-500">{streakDays} días</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {streakDays > 0 ? '¡Sigue así!' : 'Comienza ahora registrando tu visita.'}
        </p>
      </div>

      {/* Actividad reciente */}
      <div className="space-y-3">
        <h3 className="font-semibold">Actividad reciente</h3>
        <ul className="space-y-2">
          {(recent ?? []).length === 0 && (
            <li className="text-sm text-gray-500">
              Cuando muestres tu código QR en Fuego Extremo, verás aquí el registro de tus visitas y avances.
            </li>
          )}
          {(recent ?? []).map((r, idx) => {
            const d = r.created_at ? new Date(r.created_at) : null
            return (
              <li
                key={idx}
                className="rounded-xl border border-gray-100 px-3 py-2 text-sm flex items-center justify-between"
              >
                <span>{d ? format(d, "d 'de' MMM, yyyy", { locale: es }) : '—'}</span>
                <span className="text-gray-500">+{r.spins_earned ?? 1} giro</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function StatCard({
  title,
  value,
  suffix,
  theme = 'light',
}: {
  title: string
  value: number
  suffix: string
  theme?: 'light' | 'dark'
}) {
  const isDark = theme === 'dark'
  return (
    <div
      className={
        'rounded-2xl p-4 shadow-sm ' +
        (isDark
          ? 'bg-gradient-to-b from-gray-900 to-black text-white'
          : 'bg-white border border-gray-100')
      }
    >
      <div className="text-xs opacity-80">{title}</div>
      <div className="mt-1 text-3xl font-bold leading-none">{value}</div>
      <div className={'mt-1 text-xs ' + (isDark ? 'opacity-80' : 'text-gray-500')}>
        {suffix}
      </div>
    </div>
  )
}