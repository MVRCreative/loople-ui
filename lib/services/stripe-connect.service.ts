import { env } from "../env";
import { supabase } from "../supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";

export interface StripeConnectStatus {
  clubId: string;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingCompleted: boolean;
  detailsSubmitted: boolean;
  defaultCurrency: string | null;
  country: string | null;
  lastSyncedAt: string | null;
  missingSchema: boolean;
  schemaErrorMessage?: string;
}

type StripeStatusRow = {
  stripe_account_id?: unknown;
  stripe_charges_enabled?: unknown;
  stripe_payouts_enabled?: unknown;
  stripe_onboarding_completed?: unknown;
  stripe_details_submitted?: unknown;
  stripe_default_currency?: unknown;
  stripe_country?: unknown;
  stripe_connect_updated_at?: unknown;
};

export class StripeConnectService {
  private static readonly CONNECT_SELECT = `
    stripe_account_id,
    stripe_charges_enabled,
    stripe_payouts_enabled,
    stripe_onboarding_completed,
    stripe_details_submitted,
    stripe_default_currency,
    stripe_country,
    stripe_connect_updated_at
  `;

  private static async toFunctionErrorMessage(
    error: unknown,
    fallback: string,
  ): Promise<string> {
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.clone().json() as {
          error?: unknown;
          details?: Record<string, unknown>;
        };
        const remoteError =
          typeof payload?.error === "string" ? payload.error : undefined;
        const remoteCode =
          typeof payload?.details?.code === "string"
            ? payload.details.code
            : undefined;
        if (remoteError && remoteCode) return `${remoteError} (${remoteCode})`;
        if (remoteError) return remoteError;
      } catch {
        // Fall through to generic message when response body is unavailable.
      }
    }

    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }

  static async getClubStatus(clubId: string): Promise<StripeConnectStatus> {
    const fallback: StripeConnectStatus = {
      clubId,
      stripeAccountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      onboardingCompleted: false,
      detailsSubmitted: false,
      defaultCurrency: null,
      country: null,
      lastSyncedAt: null,
      missingSchema: false,
    };

    const { data, error } = await supabase
      .from("clubs")
      .select(this.CONNECT_SELECT)
      .eq("id", clubId)
      .maybeSingle();

    if (error) {
      // Keep UI functional even before DB columns are added.
      const message = error.message ?? "Unable to fetch Stripe Connect status.";
      const missingSchema =
        message.toLowerCase().includes("column") &&
        message.toLowerCase().includes("does not exist");
      return {
        ...fallback,
        missingSchema,
        schemaErrorMessage: message,
      };
    }

    const row = (data ?? {}) as StripeStatusRow;
    return {
      clubId,
      stripeAccountId:
        row.stripe_account_id != null ? String(row.stripe_account_id) : null,
      chargesEnabled: Boolean(row.stripe_charges_enabled),
      payoutsEnabled: Boolean(row.stripe_payouts_enabled),
      onboardingCompleted: Boolean(row.stripe_onboarding_completed),
      detailsSubmitted: Boolean(row.stripe_details_submitted),
      defaultCurrency:
        row.stripe_default_currency != null
          ? String(row.stripe_default_currency)
          : null,
      country: row.stripe_country != null ? String(row.stripe_country) : null,
      lastSyncedAt:
        row.stripe_connect_updated_at != null
          ? String(row.stripe_connect_updated_at)
          : null,
      missingSchema: false,
    };
  }

  static async createOnboardingLink(params: {
    clubId: string;
    returnUrl?: string;
    refreshUrl?: string;
  }): Promise<{ url: string }> {
    const defaultAppUrl = env.APP_URL;
    const basePath = env.BASE_PATH ?? "/app";
    const returnUrl =
      params.returnUrl ??
      (defaultAppUrl
        ? `${defaultAppUrl}${basePath}/admin/payments/settings?stripe=return`
        : undefined);
    const refreshUrl =
      params.refreshUrl ??
      (defaultAppUrl
        ? `${defaultAppUrl}${basePath}/admin/payments/settings?stripe=refresh`
        : undefined);

    const { data, error } = await supabase.functions.invoke(
      "stripe-connect-onboarding-link",
      {
        method: "POST",
        body: {
          club_id: params.clubId,
          return_url: returnUrl,
          refresh_url: refreshUrl,
        },
      }
    );

    if (error) {
      throw new Error(
        await this.toFunctionErrorMessage(
          error,
          "Failed to create onboarding link.",
        ),
      );
    }
    if (!data || typeof data !== "object" || !("url" in data)) {
      throw new Error(
        "Stripe onboarding endpoint returned an invalid response. Expected { url }."
      );
    }
    return { url: String((data as { url: unknown }).url) };
  }

  static async createDashboardLink(clubId: string): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke(
      "stripe-connect-dashboard-link",
      {
        method: "POST",
        body: { club_id: clubId },
      }
    );

    if (error) {
      throw new Error(
        await this.toFunctionErrorMessage(
          error,
          "Failed to create dashboard link.",
        ),
      );
    }
    if (!data || typeof data !== "object" || !("url" in data)) {
      throw new Error(
        "Stripe dashboard endpoint returned an invalid response. Expected { url }."
      );
    }
    return { url: String((data as { url: unknown }).url) };
  }
}
