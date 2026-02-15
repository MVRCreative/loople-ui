import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
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
