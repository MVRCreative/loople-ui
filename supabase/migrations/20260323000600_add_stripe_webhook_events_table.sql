-- migration: create stripe webhook event log for idempotency
-- purpose: ensure stripe webhooks are processed once and auditable
-- affected objects: public.stripe_webhook_events (new table + index + rls)
-- special considerations:
--   - table is intended for backend/service-role access only
--   - rls is enabled with no public policies to prevent client reads/writes

create table if not exists public.stripe_webhook_events (
  id bigint generated always as identity primary key,
  stripe_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

comment on table public.stripe_webhook_events is
  'idempotency and audit log for processed stripe webhooks.';

comment on column public.stripe_webhook_events.stripe_event_id is
  'unique stripe event identifier (evt_...).';
comment on column public.stripe_webhook_events.event_type is
  'stripe event type string (for example account.updated).';
comment on column public.stripe_webhook_events.payload is
  'raw stripe event payload captured at processing time.';
comment on column public.stripe_webhook_events.processed_at is
  'timestamp when this event was first processed.';

create unique index if not exists stripe_webhook_events_event_id_uidx
  on public.stripe_webhook_events (stripe_event_id);

-- every stripe connected account belongs to exactly one club in this model
create unique index if not exists clubs_stripe_account_id_uidx
  on public.clubs (stripe_account_id)
  where stripe_account_id is not null;

alter table public.stripe_webhook_events enable row level security;
