/**
 * Typed environment configuration.
 * For client-side: NEXT_PUBLIC_* vars.
 * For Edge Functions: RESEND_API_KEY, RESEND_FROM_EMAIL (set via Supabase secrets).
 */
export const env = {
  /** Supabase URL - required for client */
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  /** Supabase anon key - required for client */
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  /** Functions URL - optional override */
  FUNCTIONS_URL: process.env.NEXT_PUBLIC_FUNCTIONS_URL,
  /** Stripe publishable key for waitlist payments (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) */
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  /** App base URL for shareable links (e.g. https://app.loople.com). Falls back to window.location.origin when unset. */
  APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  /** Base path for routes (must match next.config basePath). Default /app. */
  BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? "/app",
} as const;

/**
 * Required keys for email notifications (Edge Function send-notification).
 * Set these in Supabase Dashboard > Project Settings > Edge Functions > Secrets:
 * - RESEND_API_KEY: Resend API key (get from resend.com)
 * - RESEND_FROM_EMAIL: Optional sender (e.g. "Loople <noreply@yourdomain.com>")
 */
export const NOTIFICATION_ENV_KEYS = ["RESEND_API_KEY"] as const;

/**
 * Stripe keys for waitlist payments.
 * Client: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (required for waitlist form)
 * Supabase Edge Functions (set via Dashboard > Edge Functions > Secrets):
 * - STRIPE_SECRET_KEY or STRIPE_API_KEY
 * - STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SIGNING_SECRET
 */
