import { createClientServer } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClientServer()
  
  // Probar conexión
  const { data: branches, error } = await supabase
    .from('branches')
    .select('*')
    .limit(5)

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 REWAPP
        </h1>
        
        {error ? (
          <p className="text-red-600">Error conectando a Supabase: {error.message}</p>
        ) : (
          <div>
            <p className="text-green-600 mb-4">✅ Conexión a Supabase exitosa</p>
            <p className="text-gray-600 mb-2">Sucursales encontradas:</p>
            <ul className="text-sm text-gray-500">
              {branches?.map((branch) => (
                <li key={branch.id}>• {branch.name}</li>
              ))}
            </ul>
          </div>
        )}
        
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors mt-4">
          Continuar Setup
        </button>
      </div>
    </div>
  )
}