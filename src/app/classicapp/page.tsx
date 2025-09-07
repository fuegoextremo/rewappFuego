import { createClientServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

export default async function ClassicAppPage() {
  const supabase = createClientServer();

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">🔥 Fuego Rewards</h1>
          <p className="text-center text-gray-600 mb-4">Versión Clásica (Next.js tradicional)</p>
          
          <div className="text-sm text-center mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-700">
              📍 Rutas tradicionales de Next.js con Server-Side Rendering
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link 
            href="/classicapp/profile" 
            className="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">👤</span>
              <div>
                <h3 className="font-semibold">Mi Perfil</h3>
                <p className="text-sm text-gray-600">Gestiona tu información personal</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/classicapp/coupons" 
            className="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎟️</span>
              <div>
                <h3 className="font-semibold">Mis Cupones</h3>
                <p className="text-sm text-gray-600">Ver cupones disponibles</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/classicapp/roulette" 
            className="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎡</span>
              <div>
                <h3 className="font-semibold">Ruleta</h3>
                <p className="text-sm text-gray-600">Gira y gana premios</p>
              </div>
            </div>
          </Link>

          <div className="mt-8 p-4 bg-orange-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-orange-700 mb-2">¿Prefieres la experiencia SPA?</p>
              <Link 
                href="/client" 
                className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                🚀 Ir a SPA App
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
