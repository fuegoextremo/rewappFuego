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
  // ✨ Headers simplificados para archivos Rive
  async headers() {
    return [
      {
        source: '/:path*.riv',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
