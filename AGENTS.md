<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## This repo (human + agent context)

- **App Router** lives at the repo root: `app/`, `components/`, `lib/`.
- **No `basePath`.** Public URLs are served at the root (`/dashboard`, `/admin`, etc.). A transitional `/app/:path* -> /:path*` redirect in `next.config.ts` keeps legacy links working.
- **Auth edge logic** is in `proxy.ts` (Next 16 proxy; replaces legacy `middleware.ts`).
- **Multi-tenant migration in progress.** Follow [docs/MULTITENANT_PLAN.md](docs/MULTITENANT_PLAN.md) for the current status and the full subdomain-routing architecture.
