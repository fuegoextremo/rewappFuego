// Script temporal para debug de configuraciones
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
  console.log('🔍 Verificando configuraciones en system_settings...\n');
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .order('key');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No hay configuraciones guardadas en system_settings');
    return;
  }

  console.log('✅ Configuraciones encontradas:');
  data.forEach(({ key, value }) => {
    if (key.includes('logo') || key.includes('company')) {
      console.log(`📋 ${key}: ${value || '(vacío)'}`);
    }
  });

  // Verificar específicamente el logo
  const logoSetting = data.find(s => s.key === 'company_logo_url');
  if (logoSetting) {
    console.log(`\n🖼️  Logo configurado: ${logoSetting.value || '(no configurado)'}`);
  } else {
    console.log('\n❌ No se encontró configuración de logo (company_logo_url)');
  }
}

checkSettings().then(() => process.exit(0));
