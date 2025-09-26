import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 📋 CONFIGURACIÓN DE RUTAS
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/complete-profile', '/welcome', '/auth/callback']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

// 🔐 PERMISOS DE RUTA (verificación básica sin DB)
function hasRouteAccess(pathname: string, hasValidSession: boolean): boolean {
  // Rutas públicas - siempre permitidas
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/(auth)')) {
    return true
  }

  // Todas las rutas protegidas requieren sesión válida
  // La verificación de rol específico se hace en el componente
  if (pathname.startsWith('/client') || 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/superadmin')) {
    return hasValidSession
  }

  return false
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname, searchParams } = req.nextUrl
  
  // 🚪 CASO ESPECIAL: Logout - bypass para evitar loops
  if (searchParams.get('logout') === 'true') {
    return res
  }
  
  try {
    // 🔍 VERIFICAR SESIÓN (solo JWT, sin consultas DB)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('⚠️ Error verificando sesión:', error.message)
    }

    const hasValidSession = !!session?.user
    
    // 🔐 VERIFICAR ACCESO A RUTA
    if (!hasRouteAccess(pathname, hasValidSession)) {
      const loginUrl = new URL('/login', req.url)
      if (pathname !== '/login') {
        loginUrl.searchParams.set('redirect', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }

    // 🏠 REDIRECCIÓN DESDE LOGIN SI YA ESTÁ AUTENTICADO
    if (hasValidSession && AUTH_ROUTES.includes(pathname)) {
      // Usar destino por defecto - la verificación de rol se hace en el componente
      const defaultDestination = '/client' // Por defecto todos van a client
      return NextResponse.redirect(new URL(defaultDestination, req.url))
    }

    // ✅ PERMITIR ACCESO
    return res

  } catch (error) {
    console.error('❌ Error crítico en middleware:', error)
    
    // En caso de error crítico, permitir rutas públicas
    if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/(auth)')) {
      return res
    }
    
    // Redirigir a login para rutas protegidas con error
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}