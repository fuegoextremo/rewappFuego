export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 REWAPP
        </h1>
        <p className="text-gray-600 mb-6">
          Si ves este diseño bonito, ¡Tailwind funciona perfectamente!
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
          Botón de Prueba
        </button>
      </div>
    </div>
  )
}