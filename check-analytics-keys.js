const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAnalyticsKeys() {
  console.log('🔍 Verificando claves de analytics en system_settings...\n')
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value, category')
    .like('key', 'analytics_%')
    .order('key')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('✅ No hay claves de analytics existentes. La migración agregará 6 nuevas claves.')
    console.log('📋 Claves que se agregarán:')
    console.log('  - analytics_checkin_value')
    console.log('  - analytics_coupon_avg_value') 
    console.log('  - analytics_user_acquisition_cost')
    console.log('  - analytics_spin_cost')
    console.log('  - analytics_retention_multiplier')
    console.log('  - analytics_premium_branch_multiplier')
  } else {
    console.log('⚠️  Claves de analytics existentes:')
    data.forEach(({ key, value, category }) => {
      console.log(`  - ${key}: ${value} (categoría: ${category})`)
    })
  }

  process.exit(0)
}

checkAnalyticsKeys().catch(console.error)