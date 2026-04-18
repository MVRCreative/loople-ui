import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { env } from '@/lib/env'
import {
  extractSubdomain,
  isLocalDomain,
  isReservedSubdomain,
  buildRootUrl,
} from '@/lib/utils/subdomain'

/**
 * Next 16 proxy (formerly middleware). Runs on every request that
 * matches the `config.matcher` below. Two jobs:
 *
 *   1. Refresh the Supabase session cookie on every request so SSR
 *      handlers always see a valid auth state.
 *   2. (When ENABLE_SUBDOMAIN_ROUTING is true) route tenant traffic
 *      to the /s/[subdomain]/... tree and redirect unauthenticated
 *      requests to the canonical www auth pages.
 *
 * The feature flag is off by default so this file is deployable on
 * its own. Phase 3 builds the /s/[subdomain] tree; the flag gets
 * flipped on as part of Phase 6 cleanup.
 */

const PROTECTED_ROUTES = [
  '/dashboard',
  '/messages',
  '/events',
  '/members',
  '/programs',
  '/settings',
  '/admin',
]
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/logout',
  '/auth/forgot',
  '/auth/reset-password',
]
function isProtectedPath(path: string): boolean {
  return PROTECTED_ROUTES.some((route) => path.startsWith(route))
}

function isAuthPath(path: string): boolean {
  return AUTH_ROUTES.some((route) => path.startsWith(route))
}

export async function proxy(request: NextRequest) {
  const rootDomain = env.ROOT_DOMAIN
  const enableSubdomainRouting = env.ENABLE_SUBDOMAIN_ROUTING
  const host = request.headers.get('host') ?? request.headers.get('x-forwarded-host') ?? ''
  const subdomain = enableSubdomainRouting ? extractSubdomain(host, rootDomain) : null
  const isTenantHost = Boolean(subdomain) && !isReservedSubdomain(subdomain)

  let supabaseResponse = NextResponse.next({ request })

  // On production the cookie must be shared across every tenant
  // subdomain, so we emit `Domain=.loople.app`. Localhost browsers
  // ignore Domain attributes that start with a dot, so we leave it
  // off in dev and rely on host-only cookies instead.
  const cookieDomain = isLocalDomain(rootDomain) ? undefined : `.${rootDomain}`

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
          cookiesToSet.forEach(({ name, value, options }) => {
            const merged = cookieDomain
              ? { ...options, domain: cookieDomain }
              : options
            supabaseResponse.cookies.set(name, value, merged)
          })
        },
      },
    }
  )

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError && userError.message.includes('Refresh Token')) {
      console.warn('Invalid refresh token in proxy, clearing cookies')
      request.cookies
        .getAll()
        .filter((cookie) => cookie.name.startsWith('sb-'))
        .forEach((cookie) => supabaseResponse.cookies.delete(cookie.name))
    }

    const path = request.nextUrl.pathname

    if (!enableSubdomainRouting || !isTenantHost) {
      // Legacy / root behavior. Unchanged from pre-multi-tenant code
      // apart from the cookie-domain update above.
      const isProtected = isProtectedPath(path)
      const isAuth = isAuthPath(path)
      const isHome = path === '/'

      if ((isProtected || isHome) && !user) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      if (isAuth && user && !path.startsWith('/auth/logout')) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      return supabaseResponse
    }

    // --- Tenant subdomain path (feature flag ON) -----------------------
    //
    // Auth pages NEVER run under a tenant subdomain. Bounce to the
    // canonical www host so the Supabase redirect allowlist matches
    // and cookies are issued with the shared Domain=.loople.app.
    if (isAuthPath(path)) {
      const target = buildRootUrl(rootDomain, path)
      const url = new URL(target)
      url.search = request.nextUrl.search
      return NextResponse.redirect(url)
    }

    // Gate protected tenant routes behind authentication. Public
    // tenant paths (public club landing, waitlist apply, public
    // profiles) stay open to anonymous visitors.
    if (!user && isProtectedPath(path)) {
      const loginUrl = new URL(buildRootUrl(rootDomain, '/auth/login'))
      const returnTo = new URL(path + (request.nextUrl.search || ''), request.url).toString()
      loginUrl.searchParams.set('redirectTo', returnTo)
      return NextResponse.redirect(loginUrl)
    }

    // Rewrite the request so it resolves inside the tenant route
    // tree. The rewrite is transparent to the client - the address
    // bar keeps showing e.g. /admin while the server renders
    // /s/eastside-fc/admin.
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = `/s/${subdomain}${path === '/' ? '' : path}`
    return NextResponse.rewrite(rewriteUrl)
  } catch (error) {
    console.error('Proxy error:', error)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
