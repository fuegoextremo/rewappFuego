// Helper para detectar si estamos usando Supabase local o producción
export const isLocalSupabase = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') || 
         process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost');
};

export const getSupabaseEnv = () => {
  return isLocalSupabase() ? 'LOCAL' : 'PRODUCTION';
};

export const getSupabaseUrl = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
};

// Log en consola para debugging
if (typeof window !== 'undefined') {
  console.log(`
🔧 Supabase Environment: ${getSupabaseEnv()}
📍 URL: ${getSupabaseUrl()}
${isLocalSupabase() ? '⚠️  Usando base de datos LOCAL - datos de prueba' : '✅ Usando base de datos de PRODUCCIÓN'}
  `);
}
