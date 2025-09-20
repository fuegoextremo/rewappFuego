// Script para verificar el valor real en la base de datos
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvwflgnmdhcjgqcsrgka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d2ZsZ25tZGhjamdxY3NyZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNzk4ODEsImV4cCI6MjAzODY1NTg4MX0.JTnQwzx_X5iTlGXJ7eBNI6DgcqrS-BICtfWQZnApgEo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStreakValue() {
  const userId = '333d547f-533b-4aa1-9ffd-d906d591a275';
  
  console.log('🔍 Consultando valor real en la base de datos...');
  
  // 1. Consultar user_streaks
  const { data: streakData, error: streakError } = await supabase
    .from('user_streaks')
    .select('current_count, completed_count, last_check_in, expires_at')
    .eq('user_id', userId)
    .single();
    
  if (streakError) {
    console.error('❌ Error consultando user_streaks:', streakError);
  } else {
    console.log('✅ user_streaks:', streakData);
  }
  
  // 2. Consultar users para current_streak
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('current_streak, available_spins, total_checkins')
    .eq('id', userId)
    .single();
    
  if (userError) {
    console.error('❌ Error consultando users:', userError);
  } else {
    console.log('✅ users tabla:', userData);
  }
  
  // 3. Último check-in
  const { data: checkinData, error: checkinError } = await supabase
    .from('check_ins')
    .select('created_at, points, streak_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (checkinError) {
    console.error('❌ Error consultando check_ins:', checkinError);
  } else {
    console.log('✅ Último check-in:', checkinData[0]);
  }
}

checkStreakValue().then(() => {
  console.log('🔍 Consulta completada');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});