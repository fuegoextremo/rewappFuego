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

  // CASO 1: No hay sesión - solo permitir rutas públicas
  if (!session) {
    const publicRoutes = ['/', '/login', '/register', '/forgot-password']
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/(auth)')
    
    if (!isPublicRoute) {
      // Redirigir a login con información del destino original
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return res
  }

  // CASO 2: Hay sesión - verificar que el usuario existe en user_profiles
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  // Si el usuario no existe en user_profiles (fue borrado)
  if (profileError || !profile) {
    // Limpiar sesión y redirigir a login
    await supabase.auth.signOut()
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('error', 'user_deleted')
    loginUrl.searchParams.set('message', 'Tu cuenta ha sido desactivada. Contacta al administrador.')
    return NextResponse.redirect(loginUrl)
  }

  const userRole = profile.role || 'client'

  // CASO 3: Usuario autenticado en página de login - redirigir a su dashboard
  if (pathname === '/login' || pathname.startsWith('/(auth)/login')) {
    const destination = getRoleDestination(userRole)
    return NextResponse.redirect(new URL(destination, req.url))
  }

  // CASO 4: Admin queriendo ver como cliente (modo preview)
  if (pathname.startsWith('/client') && searchParams.get('admin') === 'true') {
    if (['admin', 'superadmin', 'manager'].includes(userRole)) {
      return res // Permitir acceso en modo preview
    }
  }

  // CASO 5: Verificar permisos normales
  const access = checkAccess(pathname, userRole)
  if (!access.allowed) {
    // Redirigir a su dashboard correspondiente con error
    const destination = getRoleDestination(userRole)
    const redirectUrl = new URL(destination, req.url)
    redirectUrl.searchParams.set('error', 'unauthorized')
    redirectUrl.searchParams.set('message', 'No tienes permisos para acceder a esta página')
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}