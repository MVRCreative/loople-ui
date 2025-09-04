import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTenantByHost } from './tenant'

export async function updateSession(request: NextRequest) {
  const host = request.headers.get('host')
  const pathname = request.nextUrl.pathname

  // Handle root domain - allow marketing routes to pass through
  if (host === 'loople.app' || host === 'www.loople.app' || host === 'localhost:3000' || host === 'localhost') {
    return NextResponse.next()
  }

  // Handle tenant subdomain routing
  if (host && !host.startsWith('loople.app') && !host.startsWith('www.loople.app') && !host.includes('localhost')) {
    try {
      const tenant = await getTenantByHost(host)
      
      if (tenant) {
        // Rewrite to tenant route with slug header
        const url = request.nextUrl.clone()
        url.pathname = `/tenant${pathname}`
        
        const response = NextResponse.rewrite(url)
        response.headers.set('x-tenant-slug', tenant.slug)
        return response
      } else {
        // Unknown tenant - rewrite to unknown tenant page
        const url = request.nextUrl.clone()
        url.pathname = '/unknown-tenant'
        return NextResponse.rewrite(url)
      }
    } catch (error) {
      console.error('Error resolving tenant:', error)
      // Fallback to unknown tenant page
      const url = request.nextUrl.clone()
      url.pathname = '/unknown-tenant'
      return NextResponse.rewrite(url)
    }
  }

  // Default Supabase session handling for non-tenant routes
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Get environment variables directly to avoid build-time validation issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 
                          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api/health')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
