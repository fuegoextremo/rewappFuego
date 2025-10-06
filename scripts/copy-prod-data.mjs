#!/usr/bin/env node

/**
 * Script para copiar datos de producción a Supabase local
 * Solo copia DATOS, no esquema (el esquema ya está en las migraciones)
 */

import { createClient } from '@supabase/supabase-js'

// Configuración
const PROD_URL = 'https://wapzrqysraazykcfmrhd.supabase.co'
const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHpycXlzcmFhenlrY2ZtcmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE3Mjc0MywiZXhwIjoyMDcxNzQ4NzQzfQ.KDidua80ngVUgciopy4CSJwsmm24mqXd65M8HBYkdM0'

const LOCAL_URL = 'http://127.0.0.1:54321'
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Clientes
const prodClient = createClient(PROD_URL, PROD_SERVICE_KEY)
const localClient = createClient(LOCAL_URL, LOCAL_SERVICE_KEY)

// Tablas a copiar (en orden de dependencias)
const TABLES_TO_COPY = [
  'branches',
  'prizes',
  'system_settings',
  // auth.users y user_profiles se copiarán especialmente
]

// Tablas de actividad (opcional - pueden tener muchos datos)
const ACTIVITY_TABLES = [
  'check_ins',
  'streaks',
  'user_spins',
  'coupons',
  'roulette_spins',
]

async function copyTable(tableName) {
  console.log(`\n📋 Copiando tabla: ${tableName}`)
  
  try {
    // 1. Obtener datos de producción
    const { data, error } = await prodClient
      .from(tableName)
      .select('*')
    
    if (error) {
      console.error(`❌ Error leyendo ${tableName}:`, error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  Tabla ${tableName} está vacía`)
      return
    }
    
    console.log(`✅ Obtenidos ${data.length} registros de ${tableName}`)
    
    // 2. Limpiar tabla local (opcional)
    const { error: deleteError } = await localClient
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Borra todo
    
    if (deleteError) {
      console.warn(`⚠️  No se pudo limpiar ${tableName}:`, deleteError.message)
    }
    
    // 3. Insertar datos en local
    const { error: insertError } = await localClient
      .from(tableName)
      .insert(data)
    
    if (insertError) {
      console.error(`❌ Error insertando en ${tableName}:`, insertError.message)
      return
    }
    
    console.log(`✅ Insertados ${data.length} registros en ${tableName}`)
    
  } catch (err) {
    console.error(`❌ Error procesando ${tableName}:`, err.message)
  }
}

async function copyUsers() {
  console.log(`\n👥 Copiando usuarios (auth.users + user_profiles)`)
  
  try {
    // 1. Obtener usuarios de auth en producción
    const { data: { users: prodUsers }, error: authError } = await prodClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error leyendo auth.users:', authError.message)
      return
    }
    
    console.log(`✅ Obtenidos ${prodUsers.length} usuarios de auth.users`)
    
    // 2. Obtener perfiles de producción
    const { data: prodProfiles, error: profilesError } = await prodClient
      .from('user_profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error leyendo user_profiles:', profilesError.message)
      return
    }
    
    console.log(`✅ Obtenidos ${prodProfiles.length} perfiles de user_profiles`)
    
    // 3. Crear usuarios en local
    console.log('\n🔄 Creando usuarios en local...')
    
    for (const user of prodUsers) {
      try {
        // Crear en auth.users local
        const { data: newUser, error: createError } = await localClient.auth.admin.createUser({
          email: user.email,
          password: 'temp123456', // Contraseña temporal
          email_confirm: true,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata,
        })
        
        if (createError) {
          console.error(`❌ Error creando usuario ${user.email}:`, createError.message)
          continue
        }
        
        // Buscar su perfil
        const profile = prodProfiles.find(p => p.id === user.id)
        
        if (profile) {
          // Actualizar el perfil con el ID del nuevo usuario
          const { error: updateError } = await localClient
            .from('user_profiles')
            .update({
              ...profile,
              id: newUser.user.id, // Usar el nuevo ID
            })
            .eq('id', newUser.user.id)
          
          if (updateError) {
            console.error(`❌ Error actualizando perfil de ${user.email}:`, updateError.message)
          } else {
            console.log(`✅ Usuario ${user.email} copiado exitosamente`)
          }
        }
        
      } catch (err) {
        console.error(`❌ Error procesando usuario ${user.email}:`, err.message)
      }
    }
    
  } catch (err) {
    console.error('❌ Error copiando usuarios:', err.message)
  }
}

async function main() {
  console.log('🚀 Iniciando copia de datos de producción a local\n')
  console.log('📍 Producción:', PROD_URL)
  console.log('📍 Local:', LOCAL_URL)
  
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const answer = await new Promise(resolve => {
    rl.question('\n⚠️  ADVERTENCIA: Esto SOBRESCRIBIRÁ los datos locales.\n¿Continuar? (s/N): ', resolve)
  })
  
  rl.close()
  
  if (answer.toLowerCase() !== 's') {
    console.log('❌ Operación cancelada')
    process.exit(0)
  }
  
  console.log('\n🔄 Copiando datos...\n')
  
  // Copiar tablas de configuración
  for (const table of TABLES_TO_COPY) {
    await copyTable(table)
  }
  
  // Copiar usuarios
  await copyUsers()
  
  // Preguntar si copiar tablas de actividad
  const copyActivity = await new Promise(resolve => {
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl2.question('\n📊 ¿Copiar también tablas de actividad (check_ins, streaks, etc)? (s/N): ', answer => {
      rl2.close()
      resolve(answer.toLowerCase() === 's')
    })
  })
  
  if (copyActivity) {
    for (const table of ACTIVITY_TABLES) {
      await copyTable(table)
    }
  }
  
  console.log('\n✅ ¡Copia completada!')
  console.log('\n💡 Próximos pasos:')
  console.log('   1. Verifica los datos en Studio: http://127.0.0.1:54323')
  console.log('   2. Prueba la aplicación con: npm run dev:local')
  
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
