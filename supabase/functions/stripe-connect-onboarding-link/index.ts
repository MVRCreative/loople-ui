import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { assertUserCanManageClub, getClubForAccess } from "../_shared/club-access.ts";
import { getStripeClient } from "../_shared/stripe.ts";
import { requireAuthenticatedUser, supabaseAdmin } from "../_shared/supabase.ts";

type OnboardingRequest = {
  club_id?: unknown;
  return_url?: unknown;
  refresh_url?: unknown;
};

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const user = await requireAuthenticatedUser(req);
    const payload = (await req.json()) as OnboardingRequest;
    const clubId = toOptionalString(payload.club_id);
    if (!clubId) {
      return jsonResponse({ error: "club_id is required." }, { status: 400 });
    }
    await assertUserCanManageClub(user.id, clubId);

    const returnUrl = toOptionalString(payload.return_url);
    const refreshUrl = toOptionalString(payload.refresh_url);
    if (!returnUrl || !refreshUrl) {
      return jsonResponse(
        { error: "return_url and refresh_url are required." },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const club = await getClubForAccess(clubId);

    let stripeAccountId = club.stripe_account_id;
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { club_id: clubId },
        business_profile: club.name ? { name: club.name } : undefined,
      });
      stripeAccountId = account.id;

      const { error: updateError } = await supabaseAdmin
        .from("clubs")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_details_submitted: Boolean(account.details_submitted),
          stripe_charges_enabled: Boolean(account.charges_enabled),
          stripe_payouts_enabled: Boolean(account.payouts_enabled),
          stripe_default_currency: account.default_currency ?? null,
          stripe_country: account.country ?? null,
          stripe_onboarding_completed: Boolean(
            account.details_submitted && account.charges_enabled && account.payouts_enabled,
          ),
          stripe_connect_updated_at: new Date().toISOString(),
        })
        .eq("id", clubId);
      if (updateError) throw updateError;
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return jsonResponse({
      url: accountLink.url,
      account_id: stripeAccountId,
      expires_at: accountLink.expires_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    const status = message === "Unauthorized."
      ? 401
      : message === "Forbidden."
      ? 403
      : message === "Club not found."
      ? 404
      : 500;
    return jsonResponse({ error: message }, { status });
  }
});
