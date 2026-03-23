import Stripe from "npm:stripe@17.7.0";

function readStripeSecret(): string {
  const key = Deno.env.get("STRIPE_SECRET_KEY") ?? Deno.env.get("STRIPE_API_KEY");
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY (or STRIPE_API_KEY).");
  }
  return key;
}

export function getStripeClient(): Stripe {
  return new Stripe(readStripeSecret());
}

export function readWebhookSecret(): string {
  const secret =
    Deno.env.get("STRIPE_WEBHOOK_SECRET") ??
    Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
  if (!secret) {
    throw new Error(
      "Missing STRIPE_WEBHOOK_SECRET (or STRIPE_WEBHOOK_SIGNING_SECRET).",
    );
  }
  return secret;
}
