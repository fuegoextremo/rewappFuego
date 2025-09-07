// Script para diagnosticar problemas de Realtime
import { createClientBrowser } from './src/lib/supabase/client.js'

async function debugRealtimePermissions() {
  const supabase = createClientBrowser()
  
  console.log('🔍 Diagnosticando permisos de Realtime...')
  
  try {
    // 1. Verificar si las tablas están habilitadas para Realtime
    const { data: publications, error: pubError } = await supabase
      .from('pg_publication_tables')
      .select('*')
      .eq('pubname', 'supabase_realtime')
    
    if (pubError) {
      console.error('❌ Error consultando publicaciones:', pubError)
    } else {
      console.log('📊 Tablas habilitadas para Realtime:', publications)
    }
    
    // 2. Verificar políticas RLS para check_ins
    const { data: policies, error: polError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'check_ins')
    
    if (polError) {
      console.error('❌ Error consultando políticas:', polError)
    } else {
      console.log('🔐 Políticas RLS para check_ins:', policies)
    }
    
    // 3. Probar una suscripción simple
    console.log('🧪 Probando suscripción básica...')
    
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'check_ins'
      }, (payload) => {
        console.log('✅ Suscripción funcionando:', payload)
      })
      .subscribe((status, err) => {
        console.log('🔌 Estado de suscripción test:', status)
        if (err) console.error('❌ Error:', err)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción test exitosa')
          // Limpiar después de 3 segundos
          setTimeout(() => {
            supabase.removeChannel(channel)
            console.log('🧹 Test channel removido')
          }, 3000)
        }
      })
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar diagnóstico
debugRealtimePermissions()
