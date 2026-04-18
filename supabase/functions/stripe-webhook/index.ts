import Stripe from "npm:stripe@17.7.0";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const isTestMode = Deno.env.get("STRIPE_TEST_MODE") === "true";
const stripeSecretKey = isTestMode
  ? Deno.env.get("STRIPE_SECRET_KEY_TEST")
  : Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = isTestMode
  ? Deno.env.get("STRIPE_PAYMENT_WEBHOOK_SECRET_TEST")
  : Deno.env.get("STRIPE_PAYMENT_WEBHOOK_SECRET");

function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error(
      isTestMode
        ? "Missing STRIPE_SECRET_KEY_TEST."
        : "Missing STRIPE_SECRET_KEY.",
    );
  }
  return new Stripe(stripeSecretKey);
}

function getWebhookSecret(): string {
  if (!webhookSecret) {
    throw new Error(
      isTestMode
        ? "Missing STRIPE_PAYMENT_WEBHOOK_SECRET_TEST."
        : "Missing STRIPE_PAYMENT_WEBHOOK_SECRET.",
    );
  }
  return webhookSecret;
}

type PaymentType = "waitlist" | "program" | "event";

async function markEventProcessed(
  eventId: string,
  eventType: string,
  payload: unknown,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: eventId,
      event_type: eventType,
      payload,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // unique violation on stripe_event_id = already processed
    if ((error as { code?: string }).code === "23505") return false;
    throw error;
  }

  return Boolean(data?.id);
}

function getMetadataString(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): string | null {
  if (!metadata) return null;
  const value = metadata[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPaymentType(metadata: Stripe.Metadata | null | undefined): PaymentType | null {
  const value = getMetadataString(metadata, "type");
  if (value === "waitlist" || value === "program" || value === "event") return value;
  return null;
}

async function invokeSendNotification(body: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabaseAdmin.functions.invoke("send-notification", { body });
    if (error) {
      console.error("send-notification failed", { body, error: error.message });
    }
  } catch (err) {
    console.error("send-notification threw", {
      body,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function handleWaitlistPaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const applicationId = getMetadataString(pi.metadata, "waitlist_application_id");
  const email = getMetadataString(pi.metadata, "email");
  const memberName = getMetadataString(pi.metadata, "member_name");

  let targetQuery = supabaseAdmin
    .from("waitlist_applications")
    .update({
      payment_status: "completed",
      payment_intent_id: pi.id,
      updated_at: new Date().toISOString(),
    })
    .select("id, email, first_name, last_name, payment_status");

  if (applicationId) {
    targetQuery = targetQuery.eq("id", applicationId);
  } else {
    // Fall back to reconciling by payment_intent_id so replays remain idempotent.
    targetQuery = targetQuery.eq("payment_intent_id", pi.id);
  }

  const { data: updated, error: updateError } = await targetQuery;

  if (updateError) {
    console.error("waitlist update failed", {
      payment_intent_id: pi.id,
      error: updateError.message,
    });
    return;
  }

  const row = Array.isArray(updated) ? updated[0] : updated;
  const toEmail = email ?? (row?.email ? String(row.email) : null);
  if (!toEmail) return;

  const nameFromRow = [row?.first_name, row?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const resolvedName =
    memberName ?? (nameFromRow.length > 0 ? nameFromRow : undefined);

  await invokeSendNotification({
    to: toEmail,
    template: "waitlist_confirmation",
    data: { memberName: resolvedName },
  });
}

function parseRegistrationIds(metadata: Stripe.Metadata | null | undefined): string[] {
  const raw = getMetadataString(metadata, "program_registration_ids");
  if (!raw) return [];
  return raw
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

async function handleProgramPaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const registrationIds = parseRegistrationIds(pi.metadata);
  if (registrationIds.length === 0) {
    console.warn("program payment_intent missing program_registration_ids metadata", {
      payment_intent_id: pi.id,
    });
    return;
  }

  // Idempotency: if any row already has this payment_intent_id, treat as processed.
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("program_memberships")
    .select("id")
    .eq("payment_intent_id", pi.id)
    .limit(1);

  if (existingError) {
    console.error("program idempotency check failed", {
      payment_intent_id: pi.id,
      error: existingError.message,
    });
    return;
  }

  if (existing && existing.length > 0) {
    return;
  }

  // program_memberships.id is bigint; coerce to numbers when every token parses
  // cleanly, otherwise fall back to raw strings so PostgREST can cast.
  const numericIds = registrationIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
  const idsForUpdate: Array<number | string> =
    numericIds.length === registrationIds.length ? numericIds : registrationIds;

  const { error: updateError } = await supabaseAdmin
    .from("program_memberships")
    .update({
      payment_status: "completed",
      payment_intent_id: pi.id,
      last_payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", idsForUpdate);

  if (updateError) {
    console.error("program_memberships update failed", {
      payment_intent_id: pi.id,
      error: updateError.message,
    });
    return;
  }

  const memberEmail = getMetadataString(pi.metadata, "member_email");
  const memberName = getMetadataString(pi.metadata, "member_name");
  if (memberEmail) {
    await invokeSendNotification({
      to: memberEmail,
      template: "program_registration_confirmation",
      data: { memberName: memberName ?? undefined },
    });
  }
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const type = getPaymentType(pi.metadata);
  if (!type) {
    console.warn("payment_intent.succeeded missing type metadata", {
      payment_intent_id: pi.id,
    });
    return;
  }

  if (type === "waitlist") {
    await handleWaitlistPaymentSucceeded(pi);
    return;
  }

  if (type === "program") {
    await handleProgramPaymentSucceeded(pi);
    return;
  }

  if (type === "event") {
    // Event payments are handled in a separate follow-up ticket; log and acknowledge.
    console.info("event payment_intent.succeeded received (no handler yet)", {
      payment_intent_id: pi.id,
      club_id: getMetadataString(pi.metadata, "club_id"),
    });
    return;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const stripe = getStripe();
    const signingSecret = getWebhookSecret();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return jsonResponse({ error: "Missing stripe-signature header." }, { status: 400 });
    }

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, signingSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid signature.";
      console.error("stripe-webhook signature verification failed", { message });
      return jsonResponse({ error: message }, { status: 400 });
    }

    let shouldProcess = true;
    try {
      shouldProcess = await markEventProcessed(event.id, event.type, event as unknown);
    } catch (err) {
      console.error("stripe-webhook idempotency log failed", {
        event_id: event.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (!shouldProcess) {
      return jsonResponse({ received: true, duplicate: true });
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          await handlePaymentIntentSucceeded(event.data.object);
          break;
        }
        default:
          // Other event types are ignored here; account.* events are handled by
          // stripe-connect-webhook to keep Connect state separate from payments.
          break;
      }
    } catch (err) {
      console.error("stripe-webhook handler error", {
        event_id: event.id,
        event_type: event.type,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return jsonResponse({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected webhook error.";
    console.error("stripe-webhook failed", { message });
    // Always 200 for handled errors so Stripe doesn't retry indefinitely.
    return jsonResponse({ received: true, error: message });
  }
});
