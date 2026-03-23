import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getStripeClient, readWebhookSecret } from "../_shared/stripe.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

function toBoolean(value: unknown): boolean {
  return value === true;
}

async function markEventProcessed(eventId: string, eventType: string, payload: unknown): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: eventId,
      event_type: eventType,
      payload: payload,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // postgres duplicate key for unique stripe_event_id
    const duplicate = error.code === "23505";
    if (duplicate) return false;
    throw error;
  }

  return Boolean(data?.id);
}

async function syncClubFromAccount(account: {
  id: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  default_currency?: string | null;
  country?: string | null;
  metadata?: Record<string, string>;
}): Promise<void> {
  const clubIdFromMetadata = account.metadata?.club_id;

  const clubFilter = clubIdFromMetadata
    ? supabaseAdmin.from("clubs").select("id").eq("id", clubIdFromMetadata).maybeSingle()
    : supabaseAdmin
      .from("clubs")
      .select("id")
      .eq("stripe_account_id", account.id)
      .maybeSingle();

  const { data: club, error: clubError } = await clubFilter;
  if (clubError) throw clubError;
  if (!club?.id) return;

  const detailsSubmitted = toBoolean(account.details_submitted);
  const chargesEnabled = toBoolean(account.charges_enabled);
  const payoutsEnabled = toBoolean(account.payouts_enabled);

  const { error: updateError } = await supabaseAdmin
    .from("clubs")
    .update({
      stripe_account_id: account.id,
      stripe_details_submitted: detailsSubmitted,
      stripe_charges_enabled: chargesEnabled,
      stripe_payouts_enabled: payoutsEnabled,
      stripe_default_currency: account.default_currency ?? null,
      stripe_country: account.country ?? null,
      stripe_onboarding_completed: detailsSubmitted && chargesEnabled && payoutsEnabled,
      stripe_connect_updated_at: new Date().toISOString(),
    })
    .eq("id", club.id);

  if (updateError) throw updateError;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const stripe = getStripeClient();
    const webhookSecret = readWebhookSecret();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return jsonResponse({ error: "Missing stripe-signature header." }, { status: 400 });
    }

    const rawBody = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );

    const shouldProcess = await markEventProcessed(event.id, event.type, event as unknown);
    if (!shouldProcess) {
      return jsonResponse({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "account.updated": {
        const account = event.data.object;
        await syncClubFromAccount({
          id: account.id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          default_currency: account.default_currency ?? null,
          country: account.country ?? null,
          metadata: account.metadata ?? {},
        });
        break;
      }
      case "account.application.deauthorized": {
        const object = event.data.object;
        const accountId = object.account;
        if (accountId) {
          const { error } = await supabaseAdmin
            .from("clubs")
            .update({
              stripe_account_id: null,
              stripe_details_submitted: false,
              stripe_charges_enabled: false,
              stripe_payouts_enabled: false,
              stripe_onboarding_completed: false,
              stripe_connect_updated_at: new Date().toISOString(),
            })
            .eq("stripe_account_id", accountId);
          if (error) throw error;
        }
        break;
      }
      default:
        // Keep webhook fast and explicit; additional event handlers can be added incrementally.
        break;
    }

    return jsonResponse({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected webhook error.";
    return jsonResponse({ error: message }, { status: 400 });
  }
});
