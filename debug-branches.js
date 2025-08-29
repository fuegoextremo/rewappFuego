// Archivo temporal para debug - eliminar después
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkBranches() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Checking branches...');
  
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Branches found:', data?.length || 0);
    console.log('Branches data:', data);
  }
}

checkBranches();
