/**
 * Script para crear usuarios de prueba en Supabase local
 * Genera 30 usuarios con datos realistas
 */

const { createClient } = require('@supabase/supabase-js')

// Local (service_role para crear usuarios)
const localUrl = 'http://127.0.0.1:54321'
const localServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const localSupabase = createClient(localUrl, localServiceKey)

// Datos de prueba
const firstNames = [
  'Leonardo', 'Maria', 'Carlos', 'Ana', 'Jose', 'Laura', 'Miguel', 'Carmen',
  'Francisco', 'Isabel', 'Antonio', 'Patricia', 'Luis', 'Rosa', 'Manuel',
  'Gabriela', 'Pedro', 'Sofia', 'Diego', 'Valentina', 'Javier', 'Camila',
  'Roberto', 'Andrea', 'Fernando', 'Lucia', 'Ricardo', 'Elena', 'Alberto', 'Daniela'
]

const lastNames = [
  'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez',
  'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Morales',
  'Reyes', 'Jimenez', 'Hernandez', 'Ruiz', 'Mendoza', 'Castro', 'Ortiz',
  'Silva', 'Vargas', 'Romero', 'Medina', 'Aguilar', 'Delgado', 'Vega', 'Guzman'
]

const roles = ['client', 'client', 'client', 'client', 'client', 'verifier', 'manager', 'admin']

async function createTestUsers() {
  console.log('👥 Creando 30 usuarios de prueba...\n')
  
  try {
    // Obtener branch_id
    const { data: branches } = await localSupabase
      .from('branches')
      .select('id')
      .limit(1)
      .single()
    
    const branchId = branches?.id

    let created = 0
    let errors = 0

    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[i]
      const lastName = lastNames[i]
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.local`
      const role = roles[i % roles.length]
      const phone = `999${String(1000000 + i).substring(0, 7)}`
      
      // Crear usuario en auth.users
      const { data: newUser, error: createError } = await localSupabase.auth.admin.createUser({
        email: email,
        password: 'test123456',
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      })
      
      if (createError) {
        console.error(`  ❌ ${email}: ${createError.message}`)
        errors++
        continue
      }
      
      if (!newUser.user) {
        console.error(`  ❌ No se creó usuario para ${email}`)
        errors++
        continue
      }
      
      // Actualizar perfil con datos completos
      const { error: updateError } = await localSupabase
        .from('user_profiles')
        .update({
          email: email,
          phone: phone,
          role: role,
          branch_id: branchId,
          is_active: true
        })
        .eq('id', newUser.user.id)
      
      if (updateError) {
        console.error(`  ❌ Error actualizando perfil ${email}: ${updateError.message}`)
        errors++
        continue
      }
      
      // Crear user_spins inicial (solo available_spins existe en el schema)
      const { error: spinsError } = await localSupabase
        .from('user_spins')
        .insert({
          user_id: newUser.user.id,
          available_spins: Math.floor(Math.random() * 10) // 0-9 spins aleatorios
        })
      
      if (spinsError && !spinsError.message.includes('duplicate')) {
        console.error(`  ⚠️  Error creando spins para ${email}: ${spinsError.message}`)
      }
      
      // Crear streak inicial
      const { error: streakError } = await localSupabase
        .from('streaks')
        .insert({
          user_id: newUser.user.id,
          current_count: Math.floor(Math.random() * 15), // 0-14 días de racha
          max_count: 20,
          last_check_in: new Date().toISOString().split('T')[0],
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_completed: false,
          completed_count: Math.floor(Math.random() * 3) // 0-2 rachas completadas
        })
      
      if (streakError && !streakError.message.includes('duplicate')) {
        console.error(`  ⚠️  Error creando streak para ${email}: ${streakError.message}`)
      }
      
      created++
      const roleEmoji = role === 'admin' ? '👑' : role === 'manager' ? '📊' : role === 'verifier' ? '✅' : '👤'
      console.log(`  ${roleEmoji} ${created}. ${firstName} ${lastName} (${role}) - ${email}`)
    }
    
    console.log('\n═══════════════════════════════════════════════════')
    console.log('✅ Usuarios de prueba creados!')
    console.log('═══════════════════════════════════════════════════')
    console.log(`\n📊 Resumen:`)
    console.log(`   ✅ Creados: ${created}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log(`\n🔑 Credenciales de acceso:`)
    console.log(`   Email: cualquiera de los emails listados`)
    console.log(`   Password: test123456`)
    console.log(`\n👥 Distribución de roles:`)
    console.log(`   • Clientes: ~${Math.floor(created * 5/8)}`)
    console.log(`   • Verificadores: ~${Math.floor(created * 1/8)}`)
    console.log(`   • Managers: ~${Math.floor(created * 1/8)}`)
    console.log(`   • Admins: ~${Math.floor(created * 1/8)}`)
    console.log('═══════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('\n❌ Error fatal:', error)
  }
}

createTestUsers()
