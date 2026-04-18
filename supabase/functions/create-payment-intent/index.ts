import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getStripeClient } from "../_shared/stripe.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

type PaymentType = "waitlist" | "program" | "event";

type CreatePaymentIntentRequest = {
  club_id?: unknown;
  amount?: unknown;
  currency?: unknown;
  type?: unknown;
  metadata?: unknown;
};

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toPaymentType(value: unknown): PaymentType | null {
  if (value === "waitlist" || value === "program" || value === "event") {
    return value;
  }
  return null;
}

function sanitizeMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== "string" || key.length === 0) continue;
    if (val === null || val === undefined) continue;
    const asString = typeof val === "string" ? val : String(val);
    // Stripe caps metadata values at 500 characters.
    result[key] = asString.length > 500 ? asString.slice(0, 500) : asString;
  }
  return result;
}

type ClubPaymentRow = {
  id: string;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
};

async function loadClubForPayment(clubId: string): Promise<ClubPaymentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("clubs")
    .select("id, stripe_account_id, stripe_charges_enabled")
    .eq("id", clubId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: String(data.id),
    stripe_account_id: data.stripe_account_id ? String(data.stripe_account_id) : null,
    stripe_charges_enabled: Boolean(data.stripe_charges_enabled),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const payload = (await req.json().catch(() => ({}))) as CreatePaymentIntentRequest;

    const clubId = toNonEmptyString(payload.club_id);
    const amount = toFiniteNumber(payload.amount);
    const type = toPaymentType(payload.type);
    const currency = toNonEmptyString(payload.currency)?.toLowerCase() ?? "usd";
    const extraMetadata = sanitizeMetadata(payload.metadata);

    if (!clubId) {
      return jsonResponse({ error: "club_id is required." }, { status: 400 });
    }
    if (amount === null || amount <= 0) {
      return jsonResponse({ error: "amount must be a positive number." }, { status: 400 });
    }
    if (!type) {
      return jsonResponse(
        { error: "type must be one of 'waitlist', 'program', or 'event'." },
        { status: 400 },
      );
    }

    const club = await loadClubForPayment(clubId);
    if (!club) {
      return jsonResponse({ error: "Club not found." }, { status: 404 });
    }

    if (!club.stripe_charges_enabled || !club.stripe_account_id) {
      return jsonResponse(
        { error: "This club is not set up to accept payments yet" },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      on_behalf_of: club.stripe_account_id,
      transfer_data: { destination: club.stripe_account_id },
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...extraMetadata,
        type,
        club_id: clubId,
      },
    }, {
      apiVersion: "2024-11-20.acacia",
    });

    return jsonResponse({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    const details =
      typeof error === "object" && error !== null
        ? {
            name: "name" in error ? String((error as { name?: unknown }).name) : undefined,
            type: "type" in error ? String((error as { type?: unknown }).type) : undefined,
            code: "code" in error ? String((error as { code?: unknown }).code) : undefined,
            statusCode:
              "statusCode" in error
                ? Number((error as { statusCode?: unknown }).statusCode)
                : undefined,
          }
        : undefined;
    console.error("create-payment-intent failed", { message, details });
    return jsonResponse({ error: message, details }, { status: 500 });
  }
});
