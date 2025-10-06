/**
 * Script simple: Solo copia datos NO relacionados con usuarios
 * - Branches
 * - Prizes  
 * - System Settings
 */

const { createClient } = require('@supabase/supabase-js')

// Producción (service_role para leer)
const prodUrl = 'https://wapzrqysraazykcfmrhd.supabase.co'
const prodServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHpycXlzcmFhenlrY2ZtcmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3Mjc0MywiZXhwIjoyMDcxNzQ4NzQzfQ.KDidua80ngVUgciopy4CSJwsmm24mqXd65M8HBYkdM0'

// Local (service_role para escribir)
const localUrl = 'http://127.0.0.1:54321'
const localServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const prodSupabase = createClient(prodUrl, prodServiceKey)
const localSupabase = createClient(localUrl, localServiceKey)

async function copyConfigData() {
  console.log('🚀 Copiando configuraciones de producción a local...\n')
  
  try {
    // 1. Copiar branches
    console.log('📍 Copiando branches...')
    const { data: branches, error: branchesError } = await prodSupabase
      .from('branches')
      .select('*')
    
    if (branchesError) throw branchesError
    
    for (const branch of branches || []) {
      const { error } = await localSupabase
        .from('branches')
        .upsert(branch, { onConflict: 'id' })
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`)
      } else {
        console.log(`  ✅ ${branch.name}`)
      }
    }
    console.log(`\n  Total: ${branches?.length || 0} branches\n`)

    // 2. Copiar prizes
    console.log('🎁 Copiando premios...')
    const { data: prizes, error: prizesError } = await prodSupabase
      .from('prizes')
      .select('*')
    
    if (prizesError) throw prizesError
    
    for (const prize of prizes || []) {
      const { error } = await localSupabase
        .from('prizes')
        .upsert(prize, { onConflict: 'id' })
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`)
      } else {
        console.log(`  ✅ ${prize.name} (${prize.type})`)
      }
    }
    console.log(`\n  Total: ${prizes?.length || 0} premios\n`)

    // 3. Copiar system_settings (sin updated_by para evitar FK)
    console.log('⚙️  Copiando configuraciones del sistema...')
    const { data: settings, error: settingsError } = await prodSupabase
      .from('system_settings')
      .select('key, value, description, category')
    
    if (settingsError) throw settingsError
    
    for (const setting of settings || []) {
      const { error } = await localSupabase
        .from('system_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: setting.category || 'general' // Default si no tiene
        }, { onConflict: 'key' })
      
      if (error) {
        console.error(`  ❌ ${setting.key}: ${error.message}`)
      } else {
        console.log(`  ✅ ${setting.key} = ${setting.value}`)
      }
    }
    console.log(`\n  Total: ${settings?.length || 0} configuraciones\n`)

    console.log('═══════════════════════════════════════════════════')
    console.log('✅ Copia completada exitosamente!')
    console.log('═══════════════════════════════════════════════════')
    console.log('\n📊 Resumen:')
    console.log(`   • ${branches?.length || 0} sucursales`)
    console.log(`   • ${prizes?.length || 0} premios`)
    console.log(`   • ${settings?.length || 0} configuraciones`)
    console.log('\n💡 Ahora puedes crear usuarios manualmente en local')
    console.log('   para probar la aplicación.')
    console.log('═══════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('\n❌ Error fatal:', error)
  }
}

copyConfigData()
