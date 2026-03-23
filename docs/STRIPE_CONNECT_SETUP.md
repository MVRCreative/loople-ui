# Stripe Connect Express setup

This project now includes Stripe Connect Edge Function scaffolding for club-level onboarding.

## What is included

- `stripe-connect-onboarding-link` (Supabase Edge Function)
  - Creates a connected account (Express) if missing
  - Returns a Stripe onboarding URL
- `stripe-connect-dashboard-link` (Supabase Edge Function)
  - Returns a Stripe Express dashboard login URL
- `stripe-connect-webhook` (Supabase Edge Function)
  - Verifies webhook signature
  - Handles `account.updated` and `account.application.deauthorized`
  - Syncs Stripe status back to `clubs` table

## Required database migrations

Apply these migrations:

- `20260322235930_add_club_stripe_connect_columns.sql`
- `20260323000600_add_stripe_webhook_events_table.sql`

## Required secrets (Supabase Edge Functions)

Set in your Supabase project:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Optional fallback names already supported:

- `STRIPE_API_KEY`
- `STRIPE_WEBHOOK_SIGNING_SECRET`

## Required env vars (Vercel / Next.js)

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` (for example `https://your-app.vercel.app`)
- `NEXT_PUBLIC_BASE_PATH` (use `/app` unless you intentionally changed it)

## Deploy commands

From project root:

```bash
supabase functions deploy stripe-connect-onboarding-link
supabase functions deploy stripe-connect-dashboard-link
supabase functions deploy stripe-connect-webhook
```

Set secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Stripe dashboard configuration

1. In Stripe, enable Connect and choose **Express**.
2. Add webhook endpoint:
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-connect-webhook`
3. Subscribe events:
   - `account.updated`
   - `account.application.deauthorized`

## Smoke test checklist

1. Open `Admin -> Payments -> Payment settings`
2. Click **Connect Stripe**
3. Complete onboarding in Stripe
4. Return to app and refresh payment settings
5. Confirm status moves to ready when charges/payouts are enabled
