This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

<!-- Force deployment update -->

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Subdomain Multi-Tenancy

This application supports subdomain-based multi-tenancy with Redis caching.

### Local Development

For local development with subdomains, add entries to your `/etc/hosts` file:

```
127.0.0.1 tenant1.localhost
127.0.0.1 tenant2.localhost
127.0.0.1 myclub.localhost
```

Then access your tenants at:
- `http://tenant1.localhost:3000`
- `http://tenant2.localhost:3000`
- `http://myclub.localhost:3000`

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `UPSTASH_REDIS_REST_URL` - Redis endpoint URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token

### Production Deployment

For production, configure a wildcard DNS record:
- `*.loople.app` → Your Vercel deployment
- `loople.app` → Your Vercel deployment (for marketing site)

### Testing Tenant Resolution

Visit `/tenant/debug` on any subdomain to see the resolved tenant information.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
