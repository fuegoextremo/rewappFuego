import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 📋 MAPA DE PERMISOS POR RUTA
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/admin/dashboard': ['manager', 'admin', 'superadmin'],
  '/admin/users': ['manager', 'admin', 'superadmin'],
  '/admin/prizes': ['manager', 'admin', 'superadmin'],
  '/admin/scanner': ['verifier', 'manager', 'admin', 'superadmin'],
  '/admin/settings': ['admin', 'superadmin'],
}

// 🏠 Obtener destino según rol cuando no tiene permiso
function getRoleRedirect(userRole: string): string {
  const roleRedirects: Record<string, string> = {
    'client': '/client',
    'verifier': '/admin/scanner',
    'manager': '/admin/dashboard',
    'admin': '/admin/dashboard',
    'superadmin': '/superadmin/dashboard',
  }
  return roleRedirects[userRole] || '/login'
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname } = req.nextUrl
  
  // Solo validar rutas /admin/*
  if (!pathname.startsWith('/admin')) {
    return res
  }

  try {
    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.log('🚫 Sin sesión, redirigiendo a login')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Obtener rol del usuario
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    const userRole = profile?.role
    
    if (!userRole) {
      console.log('� Usuario sin rol, redirigiendo a client')
      return NextResponse.redirect(new URL('/client', req.url))
    }

    // Normalizar pathname
    const normalizedPath = pathname.split('?')[0].replace(/\/$/, '')
    
    // Obtener roles permitidos para esta ruta
    const allowedRoles = ROUTE_PERMISSIONS[normalizedPath]
    
    // Si la ruta está en el mapa, validar permiso
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      console.log(`🚫 Acceso denegado: ${userRole} intentó acceder a ${normalizedPath}`)
      const redirectUrl = getRoleRedirect(userRole)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
    
    console.log(`✅ Acceso permitido: ${userRole} → ${normalizedPath}`)
    return res

  } catch (error) {
    console.error('❌ Error en middleware:', error)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: '/admin/:path*',
}
