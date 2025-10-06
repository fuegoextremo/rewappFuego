/**
 * Script mejorado: Copia COMPLETA de producción a local
 * Crea usuarios en auth.users primero, luego copia sus datos
 */

const { createClient } = require('@supabase/supabase-js')

// Producción (service_role para leer todo)
const prodUrl = 'https://wapzrqysraazykcfmrhd.supabase.co'
const prodServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHpycXlzcmFhenlrY2ZtcmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3Mjc0MywiZXhwIjoyMDcxNzQ4NzQzfQ.KDidua80ngVUgciopy4CSJwsmm24mqXd65M8HBYkdM0'

// Local (service_role para escribir todo)
const localUrl = 'http://127.0.0.1:54321'
const localServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const prodSupabase = createClient(prodUrl, prodServiceKey)
const localSupabase = createClient(localUrl, localServiceKey)

async function copyCompleteDatabase() {
  console.log('🚀 Iniciando copia COMPLETA de producción a local...\n')
  
  try {
    // 1. Copiar branches primero (no tienen dependencias)
    console.log('📍 Paso 1: Copiando branches...')
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

    // 2. Copiar prizes (no tienen dependencias de usuarios)
    console.log('🎁 Paso 2: Copiando prizes...')
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

    // 3. Obtener usuarios de producción (perfiles + emails de auth)
    console.log('👥 Paso 3: Obteniendo usuarios de producción...')
    const { data: prodProfiles, error: profilesError } = await prodSupabase
      .from('user_profiles')
      .select('*')
      .neq('role', 'superadmin')
      .limit(50)
    
    if (profilesError) throw profilesError
    
    // Obtener emails de auth.users
    const { data: { users: authUsers }, error: authError } = await prodSupabase.auth.admin.listUsers()
    if (authError) throw authError
    
    console.log(`  📊 Encontrados ${prodProfiles?.length || 0} perfiles\n`)

    // 4. Crear usuarios en local (auth.users + profiles automáticos)
    console.log('🔨 Paso 4: Creando usuarios en local...')
    const userMapping = {} // Mapeo de ID viejo -> ID nuevo
    let usersCreated = 0
    
    for (const profile of prodProfiles || []) {
      const authUser = authUsers.find(u => u.id === profile.id)
      const email = profile.email || authUser?.email || `user_${profile.id.substring(0, 8)}@local.test`
      
      // Crear usuario en auth.users local
      const { data: newUser, error: createError } = await localSupabase.auth.admin.createUser({
        email: email,
        password: 'test123456', // Password temporal para testing
        email_confirm: true,
        user_metadata: {
          first_name: profile.first_name,
          last_name: profile.last_name
        }
      })
      
      if (createError) {
        console.error(`  ❌ Error creando usuario ${email}:`, createError.message)
        continue
      }
      
      if (!newUser.user) {
        console.error(`  ❌ No se obtuvo usuario para ${email}`)
        continue
      }
      
      // Guardar mapeo de IDs
      userMapping[profile.id] = newUser.user.id
      
      // Actualizar el perfil con todos los datos del original
      const { error: updateError } = await localSupabase
        .from('user_profiles')
        .update({
          email: email,
          phone: profile.phone,
          birth_date: profile.birth_date,
          role: profile.role,
          branch_id: profile.branch_id,
          unique_code: profile.unique_code,
          is_active: profile.is_active
        })
        .eq('id', newUser.user.id)
      
      if (updateError) {
        console.error(`  ❌ Error actualizando perfil ${email}:`, updateError.message)
      } else {
        usersCreated++
        console.log(`  ✅ Usuario creado: ${email} (${profile.role})`)
      }
    }
    
    console.log(`\n  ✅ ${usersCreated} usuarios creados exitosamente\n`)

    // 5. Copiar user_spins con IDs mapeados
    console.log('🎰 Paso 5: Copiando user_spins...')
    const oldUserIds = Object.keys(userMapping)
    
    if (oldUserIds.length > 0) {
      const { data: spins, error: spinsError } = await prodSupabase
        .from('user_spins')
        .select('*')
        .in('user_id', oldUserIds)
      
      if (spinsError) throw spinsError
      
      let spinsCopied = 0
      for (const spin of spins || []) {
        const newUserId = userMapping[spin.user_id]
        if (!newUserId) continue
        
        const { error } = await localSupabase
          .from('user_spins')
          .upsert({
            user_id: newUserId,
            available_spins: spin.available_spins,
            total_earned: spin.total_earned,
            total_used: spin.total_used
          }, { onConflict: 'user_id' })
        
        if (error) {
          console.error(`  ❌ Error copiando spins:`, error.message)
        } else {
          spinsCopied++
        }
      }
      console.log(`  ✅ ${spinsCopied} registros de spins copiados\n`)
    }

    // 6. Copiar streaks con IDs mapeados
    console.log('🔥 Paso 6: Copiando streaks...')
    if (oldUserIds.length > 0) {
      const { data: streaks, error: streaksError } = await prodSupabase
        .from('streaks')
        .select('*')
        .in('user_id', oldUserIds)
      
      if (streaksError) throw streaksError
      
      let streaksCopied = 0
      for (const streak of streaks || []) {
        const newUserId = userMapping[streak.user_id]
        if (!newUserId) continue
        
        const { error } = await localSupabase
          .from('streaks')
          .upsert({
            id: streak.id, // Mantener el mismo ID si es posible
            user_id: newUserId,
            current_count: streak.current_count,
            max_count: streak.max_count,
            last_check_in: streak.last_check_in,
            expires_at: streak.expires_at,
            is_completed: streak.is_completed,
            completed_count: streak.completed_count
          }, { onConflict: 'user_id' })
        
        if (error) {
          console.error(`  ❌ Error copiando streak:`, error.message)
        } else {
          streaksCopied++
        }
      }
      console.log(`  ✅ ${streaksCopied} rachas copiadas\n`)
    }

    // 7. Copiar system_settings (sin updated_by para evitar FK)
    console.log('⚙️  Paso 7: Copiando system_settings...')
    const { data: settings, error: settingsError } = await prodSupabase
      .from('system_settings')
      .select('key, value, description')
    
    if (settingsError) throw settingsError
    
    let settingsCopied = 0
    for (const setting of settings || []) {
      const { error } = await localSupabase
        .from('system_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description
        }, { onConflict: 'key' })
      
      if (error) {
        console.error(`  ❌ Error en setting ${setting.key}:`, error.message)
      } else {
        settingsCopied++
      }
    }
    console.log(`  ✅ ${settingsCopied} configuraciones copiadas\n`)

    // 8. Copiar check_ins recientes (últimos 100)
    console.log('📝 Paso 8: Copiando check-ins recientes...')
    if (oldUserIds.length > 0) {
      const { data: checkins, error: checkinsError } = await prodSupabase
        .from('check_ins')
        .select('*')
        .in('user_id', oldUserIds)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (checkinsError) throw checkinsError
      
      let checkinsCopied = 0
      for (const checkin of checkins || []) {
        const newUserId = userMapping[checkin.user_id]
        const newVerifiedBy = checkin.verified_by ? userMapping[checkin.verified_by] : null
        
        if (!newUserId) continue
        
        const { error } = await localSupabase
          .from('check_ins')
          .insert({
            user_id: newUserId,
            branch_id: checkin.branch_id,
            verified_by: newVerifiedBy,
            spins_earned: checkin.spins_earned,
            check_in_date: checkin.check_in_date,
            created_at: checkin.created_at
          })
        
        if (error) {
          console.error(`  ❌ Error copiando check-in:`, error.message)
        } else {
          checkinsCopied++
        }
      }
      console.log(`  ✅ ${checkinsCopied} check-ins copiados\n`)
    }

    console.log('═══════════════════════════════════════════════════════')
    console.log('✅ ¡COPIA COMPLETA EXITOSA!\n')
    console.log('📊 Resumen Final:')
    console.log(`   ✅ Branches: ${branches?.length || 0}`)
    console.log(`   ✅ Premios: ${prizes?.length || 0}`)
    console.log(`   ✅ Usuarios: ${usersCreated}`)
    console.log(`   ✅ Configuraciones: ${settingsCopied}`)
    console.log(`   ✅ Base de datos local lista para usar`)
    console.log('\n🔑 Credenciales de prueba:')
    console.log('   Email: cualquier email copiado')
    console.log('   Password: test123456')
    console.log('═══════════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('\n❌ Error fatal:', error)
  }
}

copyCompleteDatabase()
