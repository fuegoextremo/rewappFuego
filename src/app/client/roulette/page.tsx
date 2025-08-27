import { createClientServer } from '@/lib/supabase/server'
import SpinButton from './spin-button'

export const revalidate = 0

export default async function RoulettePage() {
  const supabase = createClientServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: spinsRow } = await supabase
    .from('user_spins')
    .select('available_spins')
    .eq('user_id', user.id)
    .maybeSingle()

  const spins = spinsRow?.available_spins ?? 0

  return (
    <section className="px-4 py-6 space-y-6">
      <h2 className="text-xl font-bold">Ruleta</h2>
      <p className="text-sm text-gray-600">
        Tienes <strong>{spins}</strong> giro(s) disponible(s).
      </p>
      <SpinButton disabled={spins <= 0} />
      {/* Aquí luego podemos listar últimos premios ganados o cupones creados */}
    </section>
  )
}