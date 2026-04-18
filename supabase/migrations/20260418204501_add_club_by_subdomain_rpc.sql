-- migration: add case-insensitive unique index on clubs.subdomain and a
--            security-definer rpc club_by_subdomain(text) that returns the
--            minimal public payload needed to resolve a tenant from an
--            incoming request host.
--
-- why: the multi-tenant middleware runs on anon requests (pre-auth) and must
-- map `eastside-fc.loople.app` -> a club record to decide whether to rewrite
-- to /s/[subdomain]/... or to /unknown-tenant. the existing clubs table is
-- rls-gated, so anon selects on it may return zero rows. a security-definer
-- function that returns only public columns is the tightest path.
--
-- affected objects:
--   - public.clubs (new unique index on lower(subdomain))
--   - public.club_by_subdomain(text) (new function)
--   - grants: execute on club_by_subdomain to anon, authenticated

-- 1. normalize existing data so the unique index can be created.
--    destructive-ish: rewrites subdomain values to lowercase. safe because
--    subdomains are treated case-insensitively everywhere in the app.
update public.clubs
set subdomain = lower(subdomain)
where subdomain is not null
  and subdomain <> lower(subdomain);

-- 2. unique index on case-folded subdomain. `if not exists` keeps the
--    migration idempotent for local db resets.
create unique index if not exists clubs_subdomain_key
  on public.clubs (lower(subdomain))
  where subdomain is not null;

-- 3. public lookup function. returns only the subset of columns that are
--    safe to expose to unauthenticated traffic (enough to render a tenant
--    shell and decide whether to show the waitlist flow). additional
--    columns should not be added here without a security review.
--
--    `security definer` runs as the function owner so it bypasses rls.
--    `set search_path = public` pins the search path to prevent hijacking.
--    `stable` lets postgres cache the result within a single statement.
create or replace function public.club_by_subdomain(sub text)
returns table (
  id bigint,
  name text,
  subdomain text,
  logo_url text,
  onboarding_completed boolean,
  waitlist_enabled boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.name::text,
    c.subdomain::text,
    c.logo_url::text,
    coalesce(c.onboarding_completed, false) as onboarding_completed,
    coalesce(c.waitlist_enabled, false) as waitlist_enabled
  from public.clubs c
  where lower(c.subdomain) = lower(sub)
  limit 1;
$$;

-- 4. grants. unauthenticated (anon) traffic needs to call this from the
--    edge middleware during request routing. authenticated users also call
--    it from layout components. no other role should hit it.
revoke all on function public.club_by_subdomain(text) from public;
grant execute on function public.club_by_subdomain(text) to anon;
grant execute on function public.club_by_subdomain(text) to authenticated;

comment on function public.club_by_subdomain(text) is
  'resolve a tenant club by its subdomain for multi-tenant routing. '
  'returns a minimal public payload. safe to call from anon context.';
