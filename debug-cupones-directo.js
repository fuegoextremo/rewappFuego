// 🎟️ SCRIPT DE TEST REALTIME CUPONES - COPIA Y PEGA EN CONSOLA
// Asegúrate de estar en una página del cliente (/client)

console.log('🚀 Iniciando test de Realtime para cupones...')

// Función para probar cupones en tiempo real
async function testCouponsRealtime(userId) {
  // Obtener Supabase desde el contexto global
  const supabase = window.__supabase || 
    (await import('/src/lib/supabase/client.js')).createClientBrowser()
  
  if (!supabase) {
    console.error('❌ No se pudo obtener cliente de Supabase')
    return
  }
  
  console.log('🎟️ Creando canal de test para CUPONES...')
  console.log('👤 Usuario ID:', userId)
  
  const channel = supabase
    .channel(`test-coupons-${userId}-${Date.now()}`)
    .on('postgres_changes', {
      event: '*', // Todos los eventos
      schema: 'public',
      table: 'coupons',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('🎟️ ¡EVENTO DE CUPÓN DETECTADO!')
      console.log('📝 Tipo:', payload.eventType)
      console.log('🎟️ Cupón:', payload.new?.unique_code || payload.old?.unique_code)
      console.log('✅ Redimido:', payload.new?.is_redeemed)
      console.log('📦 Payload completo:', payload)
      
      if (payload.eventType === 'INSERT') {
        alert(`🎟️ ¡Nuevo cupón detectado! Código: ${payload.new.unique_code}`)
      } else if (payload.eventType === 'UPDATE' && payload.new?.is_redeemed && !payload.old?.is_redeemed) {
        alert(`✅ ¡Cupón redimido! Código: ${payload.new.unique_code}`)
      }
    })
    .subscribe((status) => {
      console.log('🔌 Estado del canal de cupones:', status)
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ ¡REALTIME DE CUPONES CONECTADO EXITOSAMENTE!')
        console.log('')
        console.log('🎯 Ahora puedes probar:')
        console.log('   1. 🎰 Ve a la ruleta y gana un cupón')
        console.log('   2. 🎟️ Ve a cupones y redime uno existente')
        console.log('   3. 👀 Observa esta consola para eventos en tiempo real')
        console.log('')
        console.log('⏰ El test se desconectará automáticamente en 10 minutos')
        
        // Desconectar después de 10 minutos
        setTimeout(() => {
          console.log('⏰ Desconectando test de cupones...')
          supabase.removeChannel(channel)
          console.log('🔌 Canal desconectado')
        }, 10 * 60 * 1000)
        
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ ERROR: La tabla coupons NO está habilitada para Realtime')
        console.error('')
        console.error('📝 Solución: Ejecuta este SQL en tu Dashboard de Supabase:')
        console.error('   ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;')
        console.error('')
        
      } else if (status === 'CLOSED') {
        console.log('🔌 Canal de cupones cerrado')
      }
    })

  return channel
}

// Test completo (check-ins + cupones)
async function testRealtimeCompleto(userId) {
  const supabase = window.__supabase || 
    (await import('/src/lib/supabase/client.js')).createClientBrowser()
  
  console.log('🚀 Iniciando test COMPLETO de Realtime...')
  
  const channel = supabase
    .channel(`test-complete-${userId}-${Date.now()}`)
    // Check-ins
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'check_ins',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('🎉 ¡CHECK-IN DETECTADO!', payload)
      alert('🎉 ¡Nuevo check-in!')
    })
    // Cupones
    .on('postgres_changes', {
      event: '*',
      schema: 'public', 
      table: 'coupons',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('🎟️ ¡CUPÓN DETECTADO!', payload)
      if (payload.eventType === 'INSERT') {
        alert(`🎟️ ¡Nuevo cupón! ${payload.new.unique_code}`)
      }
    })
    .subscribe((status) => {
      console.log('🔌 Estado completo:', status)
      if (status === 'SUBSCRIBED') {
        console.log('✅ ¡TODO CONECTADO! Realtime funcionando para check-ins y cupones')
      }
    })

  return channel
}

console.log('')
console.log('✅ Funciones cargadas:')
console.log('📝 testCouponsRealtime("tu-user-id") - Solo cupones')
console.log('📝 testRealtimeCompleto("tu-user-id") - Check-ins + cupones')
console.log('')
console.log('💡 Ejemplo de uso:')
console.log('   testCouponsRealtime("123e4567-e89b-12d3-a456-426614174000")')
