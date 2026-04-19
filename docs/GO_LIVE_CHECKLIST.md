# Loople Go Live Checklist

Everything that must be verified before Loople accepts real payments from real
clubs. Work top-to-bottom. Do not flip `STRIPE_TEST_MODE` to `false` until every
Stripe item below is checked.

Legend: `[ ]` = not done, `[x]` = done, `[!]` = blocked / needs owner input.

---

## Stripe

- [ ] Flip `STRIPE_TEST_MODE` to `false` in Supabase Edge Function secrets
- [ ] Confirm `STRIPE_SECRET_KEY` in Supabase is the live `sk_live_...` key
- [ ] Confirm `STRIPE_PAYMENT_WEBHOOK_SECRET` in Supabase is the live webhook signing secret from `loople-payment-webhook` (not the test one)
- [ ] Confirm `STRIPE_WEBHOOK_SECRET` in Supabase is the live signing secret from `loople-connect-webhook`
- [ ] Confirm Vercel `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is `pk_live_...`
- [ ] Add EIN for Mover Creative in Stripe → Settings → Business → Tax details (required for payouts)
- [ ] Complete Stripe platform profile at dashboard.stripe.com/settings/connect/platform-profile
- [ ] Verify `loople-payment-webhook` is active in Stripe live mode
- [ ] Verify `loople-connect-webhook` is active in Stripe live mode

### Recommended additional Stripe checks

- [ ] Live-mode webhook endpoints subscribe to the **exact** event types the test endpoints use (`payment_intent.succeeded`, `account.updated`, `account.application.deauthorized`)
- [ ] Live `sk_live_...` key is **restricted** where possible (no keys with full permissions in edge functions)
- [ ] Confirm no team members have live-mode Stripe access they shouldn't have

---

## Supabase

- [ ] Confirm all migrations are applied (`npx supabase migration list` shows local == remote)
- [ ] Confirm RLS policies allow club admins to read `stripe_*` columns on `clubs`
- [ ] Confirm `stripe-connect-webhook` edge function is deployed
- [ ] Confirm `stripe-webhook` edge function is deployed
- [ ] Confirm `create-payment-intent` edge function is deployed
- [ ] Confirm `waitlist-create-payment-intent` is either deprecated or redirected

### Subdomain routing prerequisites

These must be completed **before** `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true` is
set in Vercel production. Supabase Auth will silently refuse redirects to hosts
that aren't on the allow list, which breaks password reset, magic link, and
OAuth flows for tenant subdomains.

- [ ] In **Supabase Dashboard → Authentication → URL Configuration**, add
  `https://*.loople.app/**` as an allowed redirect URL (manual dashboard
  action; no code / migration covers this).
- [ ] Keep `https://www.loople.app/**` in the allow list as well so the root
  marketing site and `/login` redirects continue to work.
- [ ] Verify `Site URL` is still `https://www.loople.app` so Supabase auth
  emails (`{{ .SiteURL }}`) land on `www` first and are then routed to the
  correct tenant by the post-login flow.
- [ ] Confirm the RLS migration `20260418214500_tenant_scope_posts_rls.sql`
  is applied in production — the pre-migration `qual = true` SELECT policies
  on `posts`, `post_comments`, and `post_reactions` leak data across tenants
  and must be fixed before subdomain routing is flipped on.

### Recommended additional Supabase checks

- [ ] `program_memberships.payment_intent_id` column and index exist in production (migration `20260418120000_*`)
- [ ] `stripe_webhook_events` table exists and is writable from service role only
- [ ] Service-role keys are present in edge function secrets and match the live project

---

## Vercel

- [ ] Confirm `NEXT_PUBLIC_APP_URL` points to `https://www.loople.app`
- [ ] Confirm no test keys are present in production environment variables
- [ ] Confirm latest `main` branch is deployed

### Recommended additional Vercel checks

- [ ] Preview environments use test Stripe keys; production uses live — never mix
- [ ] Production domain has valid TLS and correct DNS for Stripe webhook callbacks (webhooks go to Supabase, not Vercel, but any redirect URLs used in Connect onboarding must work over HTTPS in production)

---

## Frontend

- [ ] Complete Phase 1-3 Stripe gates (post-club-creation redirect, global banner, sidebar dot, program pricing blur)
- [ ] Remove all debug `console.log` statements added during testing
- [ ] Test full program registration payment end-to-end in production
- [ ] Test waitlist payment end-to-end in production
- [ ] Test club Connect onboarding end-to-end in production
- [ ] Verify `program_memberships.payment_status` updates to `completed` after payment
- [ ] Verify `waitlist_applications.payment_status` updates to `completed` after payment

### Recommended additional frontend checks

- [ ] Back → Continue on program registration does not create duplicate `program_memberships` rows or duplicate PaymentIntents
- [ ] "Stripe not configured" fallback never renders in production (publishable key is always set)
- [ ] `stripe.confirmPayment` success path routes the user to a real confirmation page; failure path shows a clear error
- [ ] Error boundary or toast surfaces unexpected edge function failures with a Loople-branded message, not raw JSON

---

## Legal / Business

- [ ] Terms of service live at loople.app/terms
- [ ] Privacy policy live at loople.app/privacy
- [ ] Stripe Connect platform agreement reviewed and accepted
- [ ] Confirm Loople's platform fee strategy is implemented (`application_fee_amount`)

### Recommended additional legal / business checks

- [ ] Refund policy documented and linked from the checkout / registration pages
- [ ] Support email monitored by a real human on launch day
- [ ] Runbook exists for: failed webhooks, stuck PaymentIntents, disputes, and chargebacks

---

## Launch sequence (do in this order on cutover day)

1. Merge and deploy `main` to Vercel production.
2. Deploy all three edge functions (`create-payment-intent`, `stripe-webhook`, `stripe-connect-webhook`) to Supabase.
3. Confirm live-mode webhook endpoints in Stripe Dashboard (URLs, secrets, active status).
4. Flip `STRIPE_TEST_MODE` to `false` in Supabase secrets. Redeploy the two edge functions that read it (`create-payment-intent`, `stripe-webhook`).
5. Run a single real-money smoke test: $1 program registration on a staff-owned club. Confirm money arrives in the connected account and `program_memberships.payment_status = completed`.
6. Refund the smoke-test charge from the Stripe dashboard.
7. Announce go-live.

## Rollback

If anything in the smoke test fails:

1. Flip `STRIPE_TEST_MODE` back to `true` immediately.
2. Redeploy `create-payment-intent` and `stripe-webhook`.
3. Investigate in Stripe → Developers → Events and Supabase → Logs.
4. Do not retry live mode until the root cause is documented and fixed.
