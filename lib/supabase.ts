import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/lib/env'
import { isLocalDomain } from '@/lib/utils/subdomain'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Share the session cookie across every tenant subdomain
// (e.g. www.loople.app, eastside-fc.loople.app). On localhost we omit
// the domain attribute because browsers do not accept Domain=.localhost.
// The value MUST stay in sync with the cookie domain set by proxy.ts,
// otherwise the browser will end up with duplicate cookies and users
// will be intermittently signed out.
const cookieDomain = isLocalDomain(env.ROOT_DOMAIN)
  ? undefined
  : `.${env.ROOT_DOMAIN}`

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  cookieOptions: cookieDomain
    ? {
        domain: cookieDomain,
        path: '/',
        sameSite: 'lax',
        secure: true,
      }
    : undefined,
})

// Normalize base URL (no trailing slash) so path concatenation never produces //
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

// Helper function to get the functions URL. Derives from SUPABASE_URL so one source of truth.
// Optional NEXT_PUBLIC_FUNCTIONS_URL must point to the same project (no trailing slash).
export const getFunctionsUrl = (): string => {
  const base = process.env.NEXT_PUBLIC_FUNCTIONS_URL
    ? normalizeBaseUrl(process.env.NEXT_PUBLIC_FUNCTIONS_URL)
    : normalizeBaseUrl(supabaseUrl)
  return `${base}/functions/v1`
}

// Helper function to get the auth URL
export const getAuthUrl = (): string => {
  const base = process.env.NEXT_PUBLIC_AUTH_URL
    ? normalizeBaseUrl(process.env.NEXT_PUBLIC_AUTH_URL)
    : normalizeBaseUrl(supabaseUrl)
  return `${base}/auth/v1`
}
