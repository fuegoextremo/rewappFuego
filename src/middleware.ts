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

  const isAdminRoute = pathname.startsWith('/admin')
  const isClientRoute = pathname.startsWith('/client')

  if (!isAdminRoute && !isClientRoute) {
    return res
  }

  try {
    // SEGURIDAD: getUser() verifica el JWT contra el servidor (no getSession())
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Obtener rol e is_active en una sola query
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Cuenta desactivada (soft-delete): bloquear acceso a todas las rutas protegidas
    if (profile?.is_active === false) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('error', 'cuenta_desactivada')
      return NextResponse.redirect(redirectUrl)
    }

    const userRole = profile?.role

    if (!userRole) {
      return NextResponse.redirect(new URL('/client', req.url))
    }

    // --- Rutas /admin: validar permisos por rol ---
    if (isAdminRoute) {
      const normalizedPath = pathname.split('?')[0].replace(/\/$/, '')
      const allowedRoles = ROUTE_PERMISSIONS[normalizedPath]

      if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.log(`Acceso denegado: ${userRole} intentó acceder a ${normalizedPath}`)
        return NextResponse.redirect(new URL(getRoleRedirect(userRole), req.url))
      }
    }

    return res

  } catch (error) {
    console.error('Error en middleware:', error)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/client', '/client/:path*'],
}
