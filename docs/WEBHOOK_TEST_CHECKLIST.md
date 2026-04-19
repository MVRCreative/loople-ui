# Stripe Payment Webhook — Test Mode Reconciliation Checklist

The `stripe-webhook` edge function is responsible for flipping
`program_memberships.payment_status` from `pending` to `completed` and for
writing `program_memberships.payment_intent_id` after a successful charge.
If `payment_intent.succeeded` events are not arriving in test mode, the
registration UI will hang on the "waiting for payment" state and rows in
`stripe_webhook_events` won't appear for paid test registrations.

Use this checklist to reconcile the test-mode webhook setup end-to-end. Every
item is a pre-flight before testing a paid program registration.

Legend: `[ ]` = not done, `[x]` = verified.

---

## Secrets (Supabase → Project Settings → Edge Functions → Secrets)

- [ ] `STRIPE_TEST_MODE=true` is set on the Supabase project (required so
  `create-payment-intent` and `stripe-webhook` pick the test keys).
- [ ] `STRIPE_SECRET_KEY_TEST` is set and begins with `sk_test_`.
- [ ] `STRIPE_PAYMENT_WEBHOOK_SECRET_TEST` is set and matches the signing
  secret shown in the Stripe **test-mode** dashboard for the
  `loople-payment-webhook-test` endpoint (starts with `whsec_`).
- [ ] Live secrets (`STRIPE_SECRET_KEY`, `STRIPE_PAYMENT_WEBHOOK_SECRET`) are
  still present so flipping `STRIPE_TEST_MODE=false` at go-live "just works".

## Stripe Dashboard (test mode — toggle must read "Test mode" in the top bar)

- [ ] `loople-payment-webhook-test` endpoint exists and is **active**.
- [ ] Endpoint URL is
  `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`.
- [ ] Subscribed events include at minimum `payment_intent.succeeded`
  (add `payment_intent.payment_failed` and `charge.refunded` if the function
  handles them).
- [ ] Signing secret copied into `STRIPE_PAYMENT_WEBHOOK_SECRET_TEST` matches
  the one shown on this endpoint.

## Deployment

- [ ] `stripe-webhook` edge function has been **re-deployed** after the
  `STRIPE_TEST_MODE` branching change was merged. Running
  `npx supabase functions deploy stripe-webhook` (or the equivalent CI step)
  is required — secret changes alone do not re-deploy the function.
- [ ] `create-payment-intent` edge function is also re-deployed so the
  PaymentIntent is created against the matching test account.
- [ ] `supabase functions logs stripe-webhook --project-ref <ref>` shows
  `"STRIPE_TEST_MODE=true"` (or equivalent) on cold start.

## End-to-end smoke test

- [ ] Register a real test user for a paid program and complete checkout
  using test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
- [ ] In Stripe test mode → **Developers → Events**, confirm a
  `payment_intent.succeeded` event was delivered to
  `loople-payment-webhook-test` with a `200` response.
- [ ] Query `public.stripe_webhook_events` and confirm a row with
  `type = 'payment_intent.succeeded'` and matching `payment_intent` id.
- [ ] Query `public.program_memberships` for the test registration and
  confirm `payment_status = 'completed'` and `payment_intent_id` is set to
  the `pi_...` id from the Stripe event.

## Common failure modes

- **401 / signature invalid on the endpoint**: `STRIPE_PAYMENT_WEBHOOK_SECRET_TEST`
  doesn't match the endpoint's signing secret, or the function is still using
  the live secret because `STRIPE_TEST_MODE` was set but the function wasn't
  redeployed.
- **Event shows up in Stripe but not in `stripe_webhook_events`**: the
  webhook function is failing before the insert. Check `supabase functions
  logs stripe-webhook`.
- **`program_memberships` stays `pending` after a successful event**: the
  metadata passed to the PaymentIntent is missing `program_id` /
  `program_registration_ids`. Inspect the event payload in Stripe and
  confirm `metadata` matches the args constructed in
  `app/(dashboard)/programs/[programId]/register/page.tsx`.
