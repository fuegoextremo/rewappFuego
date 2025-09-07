// Debugging script para probar Supabase Realtime
// Ejecutar en consola del navegador cuando estés en /client

console.log('🚀 Iniciando test de Supabase Realtime...')

// Función helper para probar la conexión (incluyendo cupones)
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
    // 🎟️ NUEVO: Listener para cupones
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'coupons',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('🎟️ ¡CUPÓN NUEVO DETECTADO!', payload)
      alert('🎟️ ¡Nuevo cupón ganado!')
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'coupons',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('✅ ¡CUPÓN ACTUALIZADO!', payload)
      if (payload.new.is_redeemed && !payload.old.is_redeemed) {
        alert('✅ ¡Cupón redimido!')
      }
    })
    .on('system', {}, (status) => {
      console.log('📊 Estado del canal:', status)
    })
    .subscribe((status) => {
      console.log('🔌 Suscripción:', status)
      if (status === 'SUBSCRIBED') {
        console.log('✅ Conectado exitosamente a Realtime!')
        console.log('👆 Ahora:')
        console.log('   1. Haz un check-in desde /admin/scanner')
        console.log('   2. Gana cupones en la ruleta')
        console.log('   3. Redime cupones')
      }
    })
  
  // Desconectar después de 5 minutos
  setTimeout(() => {
    console.log('⏰ Desconectando test...')
    supabase.removeChannel(channel)
  }, 5 * 60 * 1000)
  
  return channel
}

// 🎟️ Función específica para probar solo cupones
function testCouponsRealtime(userId) {
  const { createClientBrowser } = require('@/lib/supabase/client')
  
  const supabase = createClientBrowser()
  
  console.log('🎟️ Creando canal de test para CUPONES...')
  
  const channel = supabase
    .channel(`test-coupons-${userId}`)
    .on('postgres_changes', {
      event: '*', // Todos los eventos
      schema: 'public',
      table: 'coupons',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('🎟️ EVENTO DE CUPÓN:', {
        evento: payload.eventType,
        cupón: payload.new?.unique_code || payload.old?.unique_code,
        redimido: payload.new?.is_redeemed,
        payload: payload
      })
      
      if (payload.eventType === 'INSERT') {
        alert(`🎟️ ¡Nuevo cupón! Código: ${payload.new.unique_code}`)
      } else if (payload.eventType === 'UPDATE' && payload.new.is_redeemed && !payload.old.is_redeemed) {
        alert(`✅ ¡Cupón redimido! Código: ${payload.new.unique_code}`)
      }
    })
    .subscribe((status) => {
      console.log('🔌 Estado cupones:', status)
      if (status === 'SUBSCRIBED') {
        console.log('✅ ¡REALTIME DE CUPONES CONECTADO!')
        console.log('🎯 Prueba:')
        console.log('   1. Ganar un cupón en la ruleta')
        console.log('   2. Redimir un cupón existente')
        console.log('   3. Ver los eventos aquí en tiempo real')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ ERROR: La tabla coupons NO está habilitada para Realtime')
        console.error('📝 Ejecuta este SQL en tu Dashboard:')
        console.error('   ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;')
      }
    })

  // Desconectar después de 10 minutos
  setTimeout(() => {
    console.log('⏰ Desconectando test de cupones...')
    supabase.removeChannel(channel)
  }, 10 * 60 * 1000)
  
  return channel
}

// Para usar en consola:
// testRealtimeConnection('tu-user-id-aqui')
// testCouponsRealtime('tu-user-id-aqui')

console.log('✅ Script de test cargado.')
console.log('📝 Comandos disponibles:')
console.log('   testRealtimeConnection("userId") - Test completo')
console.log('   testCouponsRealtime("userId") - Solo cupones')
