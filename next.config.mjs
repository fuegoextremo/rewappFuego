/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones para navegación más rápida
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
  // Compilar optimizado
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
