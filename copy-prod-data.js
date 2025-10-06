/**
 * Script para copiar datos de producción a Supabase local
 * Mantiene los mismos UUIDs para evitar errores de foreign keys
 */

const { createClient } = require('@supabase/supabase-js')

// Producción (usando service_role para bypassear RLS)
const prodUrl = 'https://wapzrqysraazykcfmrhd.supabase.co'
const prodServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHpycXlzcmFhenlrY2ZtcmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3Mjc0MywiZXhwIjoyMDcxNzQ4NzQzfQ.KDidua80ngVUgciopy4CSJwsmm24mqXd65M8HBYkdM0'

// Local (usando service_role para bypassear RLS)
const localUrl = 'http://127.0.0.1:54321'
const localServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const prodSupabase = createClient(prodUrl, prodServiceKey)
const localSupabase = createClient(localUrl, localServiceKey)

async function copyData() {
  console.log('🚀 Iniciando copia de datos de producción a local...\n')
  
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
      
      if (error) console.error(`  ❌ Error en branch ${branch.name}:`, error.message)
    }
    console.log(`  ✅ ${branches?.length || 0} branches copiadas\n`)

    // 2. Copiar prizes
    console.log('🎁 Copiando prizes...')
    const { data: prizes, error: prizesError } = await prodSupabase
      .from('prizes')
      .select('*')
    
    if (prizesError) throw prizesError
    
    for (const prize of prizes || []) {
      const { error } = await localSupabase
        .from('prizes')
        .upsert(prize, { onConflict: 'id' })
      
      if (error) console.error(`  ❌ Error en prize ${prize.name}:`, error.message)
    }
    console.log(`  ✅ ${prizes?.length || 0} premios copiados\n`)

    // 3. Copiar user_profiles (solo estructura, no auth users)
    console.log('👥 Copiando user_profiles...')
    const { data: profiles, error: profilesError } = await prodSupabase
      .from('user_profiles')
      .select('*')
      .neq('role', 'superadmin') // Excluir superadmins
      .limit(50) // Limitar a 50 usuarios para testing
    
    if (profilesError) throw profilesError
    
    let profilesCopied = 0
    for (const profile of profiles || []) {
      const { error } = await localSupabase
        .from('user_profiles')
        .upsert(profile, { onConflict: 'id' })
      
      if (error) {
        console.error(`  ❌ Error en profile ${profile.first_name}:`, error.message)
      } else {
        profilesCopied++
      }
    }
    console.log(`  ✅ ${profilesCopied}/${profiles?.length || 0} perfiles copiados\n`)

    // 4. Copiar system_settings
    console.log('⚙️  Copiando system_settings...')
    const { data: settings, error: settingsError } = await prodSupabase
      .from('system_settings')
      .select('*')
    
    if (settingsError) throw settingsError
    
    for (const setting of settings || []) {
      const { error } = await localSupabase
        .from('system_settings')
        .upsert(setting, { onConflict: 'key' })
      
      if (error) console.error(`  ❌ Error en setting ${setting.key}:`, error.message)
    }
    console.log(`  ✅ ${settings?.length || 0} configuraciones copiadas\n`)

    // 5. Copiar user_spins (solo para usuarios copiados)
    console.log('🎰 Copiando user_spins...')
    const userIds = (profiles || []).map(p => p.id)
    
    if (userIds.length > 0) {
      const { data: spins, error: spinsError } = await prodSupabase
        .from('user_spins')
        .select('*')
        .in('user_id', userIds)
      
      if (spinsError) throw spinsError
      
      for (const spin of spins || []) {
        const { error } = await localSupabase
          .from('user_spins')
          .upsert(spin, { onConflict: 'user_id' })
        
        if (error) console.error(`  ❌ Error en spin:`, error.message)
      }
      console.log(`  ✅ ${spins?.length || 0} registros de spins copiados\n`)
    }

    // 6. Copiar streaks
    console.log('🔥 Copiando streaks...')
    if (userIds.length > 0) {
      const { data: streaks, error: streaksError } = await prodSupabase
        .from('streaks')
        .select('*')
        .in('user_id', userIds)
      
      if (streaksError) throw streaksError
      
      for (const streak of streaks || []) {
        const { error } = await localSupabase
          .from('streaks')
          .upsert(streak, { onConflict: 'user_id' })
        
        if (error) console.error(`  ❌ Error en streak:`, error.message)
      }
      console.log(`  ✅ ${streaks?.length || 0} rachas copiadas\n`)
    }

    console.log('✅ ¡Copia completada exitosamente!\n')
    console.log('📊 Resumen:')
    console.log(`   - Branches: ${branches?.length || 0}`)
    console.log(`   - Premios: ${prizes?.length || 0}`)
    console.log(`   - Usuarios: ${profilesCopied}`)
    console.log(`   - Configuraciones: ${settings?.length || 0}`)
    console.log('\n⚠️  NOTA: Los usuarios NO tienen auth.users asociado en local.')
    console.log('   Solo se copiaron los perfiles para ver la estructura de datos.')
    console.log('   Para login real, necesitas crear usuarios en local con supabase.auth.signUp()')

  } catch (error) {
    console.error('\n❌ Error fatal:', error)
  }
}

copyData()
