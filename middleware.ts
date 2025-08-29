import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Función para obtener el destino según el rol
function getRoleDestination(role: string): string {
  switch (role) {
    case 'client': return '/client'
    case 'verifier':
    case 'manager': 
    case 'admin': return '/admin/dashboard'
    case 'superadmin': return '/superadmin/dashboard'
    default: return '/login'
  }
}

// Función para verificar acceso a rutas
function checkAccess(pathname: string, role: string): { allowed: boolean } {
  // Rutas públicas
  const publicRoutes = ['/', '/login', '/register', '/forgot-password']
  if (publicRoutes.includes(pathname)) {
    return { allowed: true }
  }

  // Rutas con (auth) prefix  
  if (pathname.startsWith('/(auth)')) {
    return { allowed: true }
  }

  // Rutas de cliente
  if (pathname.startsWith('/client')) {
    return { allowed: ['client', 'verifier', 'manager', 'admin', 'superadmin'].includes(role) }
  }

  // Rutas de admin
  if (pathname.startsWith('/admin')) {
    return { allowed: ['verifier', 'manager', 'admin', 'superadmin'].includes(role) }
  }

  // Rutas de superadmin
  if (pathname.startsWith('/superadmin')) {
    return { allowed: role === 'superadmin' }
  }

  return { allowed: false }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname, searchParams } = req.nextUrl
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si no hay sesión
  if (!session) {
    const publicRoutes = ['/', '/login', '/register', '/forgot-password']
    if (!publicRoutes.includes(pathname) && !pathname.startsWith('/(auth)')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return res
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const userRole = profile?.role || 'client'

  // Si está en login y ya está autenticado → redirigir rápido
  if (pathname === '/login' || pathname === '/(auth)/login') {
    const destination = getRoleDestination(userRole)
    return NextResponse.redirect(new URL(destination, req.url))
  }

  // Admin queriendo ver como cliente
  if (pathname.startsWith('/client') && searchParams.get('admin') === 'true') {
    if (['admin', 'superadmin', 'manager'].includes(userRole)) {
      return res // Permitir acceso
    }
  }

  // Verificar permisos normales
  const access = checkAccess(pathname, userRole)
  if (!access.allowed) {
    // Redirigir con mensaje de error
    const destination = getRoleDestination(userRole)
    const redirectUrl = new URL(destination, req.url)
    redirectUrl.searchParams.set('error', 'unauthorized')
    redirectUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}