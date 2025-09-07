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

// Helper function to get the functions URL
export const getFunctionsUrl = () => {
  return process.env.NEXT_PUBLIC_FUNCTIONS_URL || `${supabaseUrl}/functions/v1`
}

// Helper function to get the auth URL
export const getAuthUrl = () => {
  return process.env.NEXT_PUBLIC_AUTH_URL || `${supabaseUrl}/auth/v1`
}
