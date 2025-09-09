import { createClientServer } from '@/lib/supabase/server'
import { redirect } from "next/navigation";
import AnimatedCouponStack from '@/components/client/AnimatedCouponStack'
import AnimatedExpiredCouponStack from '@/components/client/AnimatedExpiredCouponStack'
import Link from "next/link";

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

export default async function ClassicCouponsPage() {
  const supabase = createClientServer()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Link href="/classicapp" className="text-blue-600 hover:text-blue-800">← Volver</Link>
            <h1 className="font-semibold">Mis Cupones</h1>
            <div className="w-16"></div>
          </div>
        </div>
        <div className="p-4 max-w-md mx-auto">
          <p className="text-red-600">No se pudieron cargar los cupones.</p>
        </div>
      </div>
    )
  }

  const coupons = (data ?? []) as CouponRow[]

  const now = Date.now()
  const isActive = (c: CouponRow) => {
    const notRedeemed = !c.is_redeemed
    const notExpired = !c.expires_at || new Date(c.expires_at).getTime() >= now
    return notRedeemed && notExpired
  }

  const active = coupons.filter(isActive)
  const redeemedOrExpired = coupons.filter((c) => !isActive(c))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      {/* Header de navegación */}
      <div className="bg-white p-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link 
            href="/classicapp" 
            className="text-blue-600 hover:text-blue-800 flex items-center transition-colors"
          >
            ← Volver
          </Link>
          <h1 className="font-semibold">Mis Cupones</h1>
          <div className="w-16"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-8 max-w-md mx-auto w-full overflow-hidden">
        {/* Cupones Activos */}
        <AnimatedCouponStack 
          coupons={active}
          title="Cupones Activos"
          emptyMessage="Aún no tienes cupones activos"
          emptySubMessage="¡Sigue participando en la ruleta! 🎡"
        />

        {/* Cupones Redimidos / Vencidos */}
        <AnimatedExpiredCouponStack 
          coupons={redeemedOrExpired}
          title="Historial"
          emptyMessage="No tienes cupones en el historial"
          emptySubMessage="Los cupones usados aparecerán aquí 📋"
        />

        {/* Switch a SPA */}
        <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
          <p className="text-sm text-orange-700 mb-2">¿Prefieres la experiencia SPA?</p>
          <Link 
            href="/client" 
            className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
          >
            🚀 Ir a SPA App
          </Link>
        </div>
      </div>
    </div>
  );
}
