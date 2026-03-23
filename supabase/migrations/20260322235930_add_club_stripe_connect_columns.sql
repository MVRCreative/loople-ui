-- migration: add stripe connect metadata fields to public.clubs
-- purpose: support per-club stripe connect onboarding and readiness checks
-- affected objects: public.clubs (new nullable stripe_* columns)
-- notes:
--   - all columns are nullable for backward compatibility with existing clubs
--   - this migration is additive only and non-destructive

-- store the connected stripe account id for each club (e.g. acct_123...)
alter table public.clubs
add column if not exists stripe_account_id text;

-- capability flags synced from stripe account state
alter table public.clubs
add column if not exists stripe_charges_enabled boolean;

alter table public.clubs
add column if not exists stripe_payouts_enabled boolean;

alter table public.clubs
add column if not exists stripe_onboarding_completed boolean;

alter table public.clubs
add column if not exists stripe_details_submitted boolean;

-- optional locale/payment metadata for display
alter table public.clubs
add column if not exists stripe_default_currency text;

alter table public.clubs
add column if not exists stripe_country text;

-- last time stripe status was synchronized to local database
alter table public.clubs
add column if not exists stripe_connect_updated_at timestamptz;

comment on column public.clubs.stripe_account_id is
  'stripe connected account id for the club.';
comment on column public.clubs.stripe_charges_enabled is
  'true when stripe reports charges are enabled on the connected account.';
comment on column public.clubs.stripe_payouts_enabled is
  'true when stripe reports payouts are enabled on the connected account.';
comment on column public.clubs.stripe_onboarding_completed is
  'true when the club has completed stripe connect onboarding.';
comment on column public.clubs.stripe_details_submitted is
  'true when required legal/business details are submitted to stripe.';
comment on column public.clubs.stripe_default_currency is
  'default currency for the connected account (for example usd).';
comment on column public.clubs.stripe_country is
  'iso country code for the connected account.';
comment on column public.clubs.stripe_connect_updated_at is
  'timestamp of last sync from stripe account state.';
