import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // getUser() validates the token server-side and refreshes if expired.
    // getSession() only reads from cookies and can't handle chunked storage
    // reliably with @supabase/ssr >=0.5.
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError && userError.message.includes('Refresh Token')) {
      console.warn('Invalid refresh token in middleware, clearing cookies')
      request.cookies.getAll()
        .filter(cookie => cookie.name.startsWith('sb-'))
        .forEach(cookie => supabaseResponse.cookies.delete(cookie.name))
    }

    const basePath = '/app'
    const path = request.nextUrl.pathname.replace(new RegExp(`^${basePath}`), '') || '/'

    const protectedRoutes = ['/dashboard', '/messages', '/events', '/members', '/programs', '/settings', '/admin']
    const authRoutes = ['/auth/login', '/auth/signup', '/auth/logout', '/auth/forgot', '/auth/reset-password']

    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
    const isAuthRoute = authRoutes.some(route => path.startsWith(route))
    const isAdminRoute = path.startsWith('/admin')

    if (isProtectedRoute && !user) {
      const redirectUrl = new URL(`${basePath}/auth/login`, request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (isAuthRoute && user && !path.startsWith('/auth/logout')) {
      return NextResponse.redirect(new URL(basePath, request.url))
    }

    if (user && isAdminRoute) {
      const metadata = user.user_metadata as Record<string, unknown> | undefined
      const appMeta = user.app_metadata as Record<string, unknown> | undefined

      const hasGlobalAdmin =
        appMeta?.isAdmin === true ||
        metadata?.role === 'Admin' ||
        metadata?.isAdmin === true

      if (hasGlobalAdmin) {
        return supabaseResponse
      }

      const userId = user.id
      if (userId) {
        const { data: ownedClubs } = await supabase
          .from('clubs')
          .select('id')
          .eq('owner_id', userId)
          .limit(1)

        if (ownedClubs?.length) {
          return supabaseResponse
        }

        const { data: adminMemberships } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', userId)
          .in('role', ['admin', 'Admin'])
          .limit(1)

        if (adminMemberships?.length) {
          return supabaseResponse
        }
      }

      return NextResponse.redirect(new URL(basePath, request.url))
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    return supabaseResponse
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