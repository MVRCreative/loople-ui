import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Root (/) is handled by rewrites in next.config - serves /app content without redirect
    // Refresh session if expired - required for Server Components
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // If there's a refresh token error, clear the session cookies
    if (sessionError && sessionError.message.includes('Refresh Token')) {
      console.warn('Invalid refresh token in middleware, clearing cookies')
      // Clear all Supabase cookies
      const cookieNames = request.cookies.getAll()
        .filter(cookie => cookie.name.startsWith('sb-'))
        .map(cookie => cookie.name)
      
      cookieNames.forEach(name => {
        response.cookies.delete(name)
      })
    }

    // Normalize path for basePath (e.g. /app/admin -> /admin)
    const basePath = '/app'
    const path = request.nextUrl.pathname.replace(new RegExp(`^${basePath}`), '') || '/'

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/messages', '/events', '/members', '/programs', '/settings', '/admin']
    const authRoutes = ['/auth/login', '/auth/signup', '/auth/logout', '/auth/forgot', '/auth/reset-password']

    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
    const isAuthRoute = authRoutes.some(route => path.startsWith(route))
    const isAdminRoute = path.startsWith('/admin')

    // Redirect unauthenticated users from protected routes to login
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL(`${basePath}/auth/login`, request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users from auth routes to home
    if (isAuthRoute && session && !path.startsWith('/auth/logout')) {
      return NextResponse.redirect(new URL(basePath, request.url))
    }

    // Admin routes: require user to be admin (global metadata or per-club owner/admin)
    if (session && isAdminRoute) {
      const user = session.user
      const metadata = user?.user_metadata as Record<string, unknown> | undefined
      const appMeta = user?.app_metadata as Record<string, unknown> | undefined

      const hasGlobalAdmin =
        appMeta?.isAdmin === true ||
        metadata?.role === 'Admin' ||
        metadata?.isAdmin === true

      if (hasGlobalAdmin) {
        return response
      }

      // Check per-club: is user owner of any club or admin in any club?
      const userId = user?.id
      if (userId) {
        const { data: ownedClubs } = await supabase
          .from('clubs')
          .select('id')
          .eq('owner_id', userId)
          .limit(1)

        if (ownedClubs?.length) {
          return response
        }

        const { data: adminMemberships } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', userId)
          .in('role', ['admin', 'Admin'])
          .limit(1)

        if (adminMemberships?.length) {
          return response
        }
      }

      // Not admin: redirect to home
      return NextResponse.redirect(new URL(basePath, request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On any auth error, let the request through (will redirect via client-side logic)
    return response
  }
}

export const config = {
  matcher: [
    // Explicitly match root - required when basePath is set (Next.js doesn't match / otherwise)
    '/',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}