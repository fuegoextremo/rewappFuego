'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function RealtimeTestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [spinsData, setSpinsData] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  // 🔐 Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClientBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  // 🔄 Cargar datos iniciales
  const loadInitialData = async () => {
    if (!user?.id) return
    
    const supabase = createClientBrowser()
    const { data } = await supabase
      .from('user_spins')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    setSpinsData(data)
    console.log('📊 Datos iniciales:', data)
  }

  // 🎯 Configurar Realtime
  useEffect(() => {
    if (!user?.id) return

    console.log('🚀 Iniciando test de Realtime para:', user.id)
    
    const supabase = createClientBrowser()
    
    const channel = supabase
      .channel(`test-realtime-${user.id}`)
      .on('postgres_changes', {
        event: '*', // Todos los eventos
        schema: 'public',
        table: 'user_spins'
      }, (payload: any) => {
        const timestamp = new Date().toLocaleTimeString()
        const newEvent = {
          id: Date.now(),
          timestamp,
          event: payload.eventType || payload.event || 'UNKNOWN',
          table: payload.table,
          old: payload.old,
          new: payload.new,
          userMatch: (payload.new as any)?.user_id === user.id || (payload.old as any)?.user_id === user.id
        }
        
        console.log('🔥 EVENTO REALTIME RECIBIDO:', {
          event: newEvent.event,
          table: newEvent.table,
          userId: (payload.new as any)?.user_id || (payload.old as any)?.user_id,
          ourUserId: user.id,
          isOurUser: newEvent.userMatch,
          payload: payload
        })
        
        setEvents(prev => [newEvent, ...prev.slice(0, 9)]) // Mantener últimos 10
        
        // Actualizar datos si es nuestro usuario y es UPDATE
        if (newEvent.userMatch && payload.new) {
          setSpinsData(payload.new)
          console.log('✅ Datos actualizados por Realtime:', payload.new)
        }
      })
      .subscribe((status: any) => {
        console.log('📡 Estado Realtime:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    loadInitialData()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // 🛠️ Test con Service Role (bypassa RLS)
  const handleTestSpinServiceRole = async () => {
    if (!user?.id) return
    
    setLoading(true)
    
    try {
      // Using direct API call to bypass RLS
      const response = await fetch('/api/debug/test-spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentSpins: spinsData?.available_spins || 0
        })
      })
      
      const result = await response.json()
      console.log('🛠️ Service Role result:', result)
      
      if (result.success) {
        console.log('✅ Service Role UPDATE successful:', result.data)
        setSpinsData(result.data)
      } else {
        console.error('❌ Service Role error:', result.error)
      }
    } catch (error) {
      console.error('❌ Service Role error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🎰 Simular spin (UPDATE manual)
  const handleTestSpin = async () => {
    if (!user?.id) return
    
    setLoading(true)
    
    try {
      const supabase = createClientBrowser()
      
      console.log('🔍 Buscando registro para usuario:', user.id)
      
      // Primero verificar si existe el registro
      const { data: existing, error: selectError } = await supabase
        .from('user_spins')
        .select('*')
        .eq('user_id', user.id)
        .single()
        
      console.log('🔍 Resultado búsqueda:', { existing, selectError })
        
      if (!existing) {
        console.error('❌ No se encontró registro de user_spins para el usuario', user.id)
        return
      }
      
      const newSpinCount = (existing.available_spins || 0) - 1
      console.log('🎯 Actualizando spins de', existing.available_spins, 'a', newSpinCount)
      
      // Hacer el UPDATE
      const { data, error } = await supabase
        .from('user_spins')
        .update({ 
          available_spins: newSpinCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()

      console.log('📝 Resultado UPDATE:', { data, error, userId: user.id })

      if (error) {
        console.error('❌ Error en spin:', error)
      } else {
        console.log('✅ Spin ejecutado:', data)
        // Actualizar datos locales
        if (data && data[0]) {
          setSpinsData(data[0])
        }
      }
    } catch (error) {
      console.error('❌ Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🔄 Refresh manual
  const handleRefresh = () => {
    loadInitialData()
  }

  if (!user) {
    return <div className="p-4">❌ No hay usuario autenticado</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Test de Realtime - user_spins</h1>
      
      {/* Estado de conexión */}
      <div className="mb-6 p-4 rounded-lg border">
        <h2 className="font-semibold mb-2">📡 Estado de Realtime</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? '✅ Conectado' : '❌ Desconectado'}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">Usuario: {user.id}</p>
      </div>

      {/* Datos actuales */}
      <div className="mb-6 p-4 rounded-lg border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">📊 Datos Actuales</h2>
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            🔄 Refresh
          </button>
        </div>
        {spinsData ? (
          <div className="space-y-1 text-sm">
            <p><strong>Available Spins:</strong> {spinsData.available_spins}</p>
            <p><strong>Total Spins:</strong> {spinsData.total_spins}</p>
            <p><strong>Updated At:</strong> {new Date(spinsData.updated_at).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-gray-500">Cargando...</p>
        )}
      </div>

      {/* Botón de test */}
      <div className="mb-6 space-y-3">
        <div>
          <button
            onClick={handleTestSpin}
            disabled={loading || !isConnected}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 mr-3"
          >
            {loading ? '⏳ Procesando...' : '🎰 Test Spin (RLS)'}
          </button>
          <button
            onClick={handleTestSpinServiceRole}
            disabled={loading}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? '⏳ Procesando...' : '🛠️ Test Spin (Service Role)'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Prueba ambos botones para ver si el problema es RLS o configuración de Realtime.
        </p>
      </div>

      {/* Log de eventos */}
      <div className="p-4 rounded-lg border">
        <h2 className="font-semibold mb-2">📋 Eventos de Realtime ({events.length}/10)</h2>
        {events.length === 0 ? (
          <p className="text-gray-500 italic">No hay eventos aún. Haz clic en "Test Spin" para probar.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((event) => (
              <div 
                key={event.id} 
                className={`p-2 rounded text-sm border-l-4 ${
                  event.userMatch ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{event.event}</span>
                    <span className="ml-2 text-gray-600">{event.table}</span>
                    <span className={`ml-2 px-1 rounded text-xs ${
                      event.userMatch ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {event.userMatch ? 'MI USUARIO' : 'OTRO USUARIO'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{event.timestamp}</span>
                </div>
                {event.new && (
                  <div className="mt-1 text-xs text-gray-600">
                    Spins: {(event.new as any).available_spins} | Updated: {(event.new as any).updated_at}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
