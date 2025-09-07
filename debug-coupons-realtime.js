// 🎟️ Script para probar Realtime de cupones
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Iniciando prueba de Realtime para cupones...')

// 🔌 Conectar a Realtime
const channel = supabase
  .channel('test:coupons:realtime')
  .on('postgres_changes', {
    event: '*', // Todos los eventos
    schema: 'public',
    table: 'coupons'
  }, (payload) => {
    console.log('🎟️ Evento de cupón detectado:')
    console.log('  - Evento:', payload.eventType)
    console.log('  - Usuario:', payload.new?.user_id || payload.old?.user_id)
    console.log('  - Cupón ID:', payload.new?.id || payload.old?.id)
    console.log('  - Código:', payload.new?.unique_code || payload.old?.unique_code)
    console.log('  - Redimido:', payload.new?.is_redeemed)
    console.log('  - Payload completo:', JSON.stringify(payload, null, 2))
    console.log('---')
  })
  .subscribe((status) => {
    console.log('🔌 Estado del canal:', status)
    
    if (status === 'SUBSCRIBED') {
      console.log('✅ Canal suscrito exitosamente')
      console.log('📝 Ahora puedes:')
      console.log('   1. Crear un cupón desde la ruleta')
      console.log('   2. Redimir un cupón existente')
      console.log('   3. Ver los eventos en tiempo real aquí')
      console.log('')
      console.log('⏳ Esperando eventos... (Ctrl+C para salir)')
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Error en el canal de cupones')
      console.error('   - Verifica que la tabla esté en la publicación realtime')
      console.error('   - Comando: ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;')
    }
  })

// 🧹 Cleanup al cerrar
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando conexión Realtime...')
  supabase.removeChannel(channel)
  process.exit(0)
})

// 🔄 Función para crear un cupón de prueba
async function createTestCoupon(userId = 'test-user-id') {
  console.log(`\n🧪 Creando cupón de prueba para usuario: ${userId}`)
  
  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        user_id: userId,
        unique_code: `TEST-${Date.now()}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
        source: 'debug-script',
        is_redeemed: false
      })
      .select()

    if (error) {
      console.error('❌ Error creando cupón:', error)
    } else {
      console.log('✅ Cupón creado:', data[0])
    }
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

// 📝 Mostrar ayuda
console.log('')
console.log('💡 Comandos disponibles:')
console.log('   - Para crear un cupón de prueba, usa: createTestCoupon("tu-user-id")')
console.log('')
