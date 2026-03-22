<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## This repo (human + agent context)

- **App Router** lives at the repo root: `app/`, `components/`, `lib/`.
- **`basePath`** is `/app` (see `next.config.ts`); public URLs are under `/app/...` unless redirects say otherwise.
- **Auth edge logic** is in `proxy.ts` (Next 16 proxy; replaces legacy `middleware.ts`).
