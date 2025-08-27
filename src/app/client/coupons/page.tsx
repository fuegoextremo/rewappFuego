import { createClientServer } from '@/lib/supabase/server'
import CouponCard from '@/components/client/CouponCard'


type CouponRow = {
  id: string
  unique_code: string
  expires_at: string | null
  is_redeemed: boolean | null
  redeemed_at: string | null
  source: string | null
  created_at: string | null
  prizes: {
    name: string
    image_url: string | null
  } | null
}

export const revalidate = 0

export default async function CouponsPage() {
  const supabase = createClientServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Traemos cupones + premio
  const { data, error } = await supabase
    .from('coupons')
    .select(
      `
        id, unique_code, expires_at, is_redeemed, redeemed_at, source, created_at,
        prizes ( name, image_url )
      `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <section className="px-4 py-6">
        <h2 className="text-xl font-bold">Cupones</h2>
        <p className="mt-2 text-sm text-red-600">No se pudieron cargar los cupones.</p>
      </section>
    )
  }

  const coupons = (data ?? []) as CouponRow[]

  const now = Date.now()
  const isActive = (c: CouponRow) => {
    const notRedeemed = !c.is_redeemed
    const notExpired =
      !c.expires_at || new Date(c.expires_at).getTime() >= now
    return notRedeemed && notExpired
  }

  const active = coupons.filter(isActive)
  const redeemedOrExpired = coupons.filter((c) => !isActive(c))

  return (
    <section className="px-4 py-6 space-y-6">
      <header>
        <h2 className="text-xl font-bold">Tus cupones</h2>
        <p className="text-sm text-gray-600">
          Aquí verás tus premios ganados en la ruleta o por racha.
        </p>
      </header>

      {/* Activos */}
      <div className="space-y-3">
        <h3 className="font-semibold">Activos</h3>
        {active.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no tienes cupones activos. ¡Sigue participando! 🎡
          </p>
        ) : (
          <ul className="space-y-3">
            {active.map((c) => (
              <li key={c.id}>
                <CouponCard coupon={c} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Redimidos / Vencidos */}
      <div className="space-y-3">
        <h3 className="font-semibold">Usados o vencidos</h3>
        {redeemedOrExpired.length === 0 ? (
          <p className="text-sm text-gray-500">Sin historial por ahora.</p>
        ) : (
          <ul className="space-y-3">
            {redeemedOrExpired.map((c) => (
              <li key={c.id}>
                <CouponCard coupon={c} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

