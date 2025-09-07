// Debugging script para probar Supabase Realtime
// Ejecutar en consola del navegador cuando estés en /client

console.log('🚀 Iniciando test de Supabase Realtime...')

// Función helper para probar la conexión
function testRealtimeConnection(userId) {
  const { createClientBrowser } = require('@/lib/supabase/client')
  
  const supabase = createClientBrowser()
  
  console.log('📡 Creando canal de test...')
  
  const channel = supabase
    .channel(`test-realtime-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'check_ins',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('🎉 ¡REALTIME FUNCIONA! Nuevo check-in:', payload)
      alert('🎉 ¡Realtime detectó un nuevo check-in!')
    })
    .on('system', {}, (status) => {
      console.log('📊 Estado del canal:', status)
    })
    .subscribe((status) => {
      console.log('🔌 Suscripción:', status)
      if (status === 'SUBSCRIBED') {
        console.log('✅ Conectado exitosamente a Realtime!')
        console.log('👆 Ahora haz un check-in desde /admin/scanner')
      }
    })
  
  // Desconectar después de 5 minutos
  setTimeout(() => {
    console.log('⏰ Desconectando test...')
    supabase.removeChannel(channel)
  }, 5 * 60 * 1000)
  
  return channel
}

// Para usar en consola:
// testRealtimeConnection('tu-user-id-aqui')

console.log('✅ Script de test cargado. Usa: testRealtimeConnection("userId")')
