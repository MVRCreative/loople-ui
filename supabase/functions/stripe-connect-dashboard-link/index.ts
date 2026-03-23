import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { assertUserCanManageClub, getClubForAccess } from "../_shared/club-access.ts";
import { getStripeClient } from "../_shared/stripe.ts";
import { requireAuthenticatedUser } from "../_shared/supabase.ts";

type DashboardRequest = {
  club_id?: unknown;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const user = await requireAuthenticatedUser(req);
    const payload = (await req.json()) as DashboardRequest;
    const clubId = typeof payload.club_id === "string" ? payload.club_id.trim() : "";
    if (!clubId) {
      return jsonResponse({ error: "club_id is required." }, { status: 400 });
    }

    await assertUserCanManageClub(user.id, clubId);

    const club = await getClubForAccess(clubId);
    if (!club.stripe_account_id) {
      return jsonResponse(
        { error: "Club does not have a Stripe account yet." },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const loginLink = await stripe.accounts.createLoginLink(club.stripe_account_id);
    return jsonResponse({ url: loginLink.url });
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
