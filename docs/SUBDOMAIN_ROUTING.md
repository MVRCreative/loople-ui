# Subdomain routing

Loople is a multi-tenant SaaS: every club gets its own subdomain
(`clubname.loople.app`). This document covers how routing works, how to
run the app against subdomains locally, and how to troubleshoot the
most common issues.

See [MULTITENANT_PLAN.md](MULTITENANT_PLAN.md) for the migration plan
and phase status.

## Architecture (one-liner)

Edge middleware reads the `host` header, calls `extractSubdomain()`,
rewrites tenant traffic to `/s/[subdomain]/...`, and leaves root/www
traffic alone. Auth pages live on `www.loople.app` with a session
cookie scoped to `.loople.app` so sign-in spans every tenant.

## Key files

- [lib/utils/subdomain.ts](../lib/utils/subdomain.ts) - pure helpers
  (`extractSubdomain`, `isReservedSubdomain`, `buildTenantUrl`,
  `buildRootUrl`). No I/O; safe to import anywhere.
- [lib/env.ts](../lib/env.ts) - `ROOT_DOMAIN` (`NEXT_PUBLIC_ROOT_DOMAIN`).
- [lib/services/clubs.service.ts](../lib/services/clubs.service.ts) -
  `ClubsService.getClubBySubdomain()` calls the security-definer RPC
  `public.club_by_subdomain(text)`.
- [supabase/migrations/20260418204501_add_club_by_subdomain_rpc.sql](../supabase/migrations/20260418204501_add_club_by_subdomain_rpc.sql) -
  creates the RPC and a case-insensitive unique index on
  `clubs.subdomain`.
- [proxy.ts](../proxy.ts) - Next 16 proxy (formerly `middleware.ts`).
  Owns the per-request routing decision. Subdomain rewrites are
  gated behind `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true`.

## Reserved subdomains

`www`, `app`, `admin`, `api`, `preview`, `status`, `static`. These
never resolve to a tenant - they fall through to root/marketing/auth
routing. `admin.loople.app` is intentionally held for a future
super-admin surface.

## Environment variables

| Var | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `loople.app` | Apex used to derive tenant subdomains. Set per environment. |
| `NEXT_PUBLIC_APP_URL` | `https://www.loople.app` | Legacy base URL; falls back to `window.location.origin`. |
| `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING` | `true` | Flag gating the proxy subdomain rewrites. Leave unset / `false` until the `/s/[subdomain]` route tree exists (Phase 3). |

## Local development

Modern browsers resolve `*.localhost` to the loopback address, so you
can reach a dev tenant at `http://eastside-fc.localhost:3000` without
editing `/etc/hosts`.

### 1. Set the root domain

In `.env.local`:

```
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```

### 2. Start the dev server

```
npm run dev
```

### 3. Visit a tenant

Open `http://eastside-fc.localhost:3000/` in Chrome, Firefox, or Edge.

### Safari caveat

Safari does **not** resolve `*.localhost` by default. Two options:

- Add entries to `/etc/hosts`:
  ```
  127.0.0.1 eastside-fc.localhost
  127.0.0.1 dolphins.localhost
  ```
- Or use a tool like `dnsmasq` to wildcard-resolve `*.localhost`.

### Testing unknown tenants

Visit `http://nonexistent.localhost:3000/`. The tenant layout
(`app/s/[subdomain]/layout.tsx`) calls `notFound()` when the
subdomain doesn't map to a club, which renders the sibling
`not-found.tsx`. The root-host `/unknown-tenant` page is kept as
an explicit navigation target for direct links and emails.

## Production DNS

- Vercel is configured with a wildcard domain `*.loople.app`. No
  additional DNS work is required when adding a club; the record
  already covers every subdomain.
- Verify with `dig +short '*.loople.app'` (requires a dig version with
  wildcard support) or by adding a new club and hitting its subdomain.

## Cookie domain

The Supabase browser and server clients both emit session cookies
with `Domain=.loople.app` (in production) so that a session created on
`www.loople.app` is readable by every `*.loople.app` tenant. On
localhost the domain attribute is omitted - browsers do not treat
`.localhost` as a public suffix.

Troubleshooting:

- Two cookies with different `Domain` values in DevTools -> Application
  means the browser and server disagree. Check that both code paths
  import the same `ROOT_DOMAIN` constant.
- First deploy after Phase 2 invalidates any pre-existing `www`-only
  session cookies; users will be signed out once.

## RPC details

`public.club_by_subdomain(text)` runs `SECURITY DEFINER` with a pinned
`search_path = public`. It returns only the columns safe to expose to
unauthenticated traffic. Adding a column requires a migration and a
brief security review - the middleware is called from anon contexts.

## Stripe and email URLs

- Stripe Connect onboarding/refresh URLs are built from
  `window.location.origin` at call time. On a tenant subdomain the
  origin is already the tenant host, so Stripe returns users to
  e.g. `eastside-fc.loople.app/admin/payments/settings` without any
  extra code.
- Supabase `resetPasswordForEmail` uses the tenant's origin for the
  redirect URL. Make sure `https://*.loople.app/**` is in the
  Supabase **Authentication > URL Configuration** allow list so
  subdomain redirects aren't blocked.
- Supabase email templates (confirm signup, magic link, invite) use
  `{{ .SiteURL }}` by default. Keep `.SiteURL` set to
  `https://www.loople.app` so auth emails consistently land on
  `www` first; users are then routed to their tenant by the post-
  login flow.

## Transitional `/app/:path*` redirect

`next.config.ts` has a temporary `/app/:path* -> /:path*` redirect
to keep existing email links, bookmarks, and Stripe return URLs
alive after the `basePath="/app"` removal. Remove it after a
30-day observation window once metrics show no traffic on the
old paths.
