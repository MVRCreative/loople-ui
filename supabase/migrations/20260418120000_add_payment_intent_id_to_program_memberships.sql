alter table public.program_memberships
  add column if not exists payment_intent_id text;

create index if not exists program_memberships_payment_intent_id_idx
  on public.program_memberships (payment_intent_id);
