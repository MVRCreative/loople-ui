"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeftRight, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useClub } from "@/lib/club-context";
import { useAdminClubPageAccess } from "@/lib/hooks/use-admin-club-page-access";
import { StripeConnectService, type StripeConnectStatus } from "@/lib/services/stripe-connect.service";
import { env } from "@/lib/env";

function getSeverity(status: StripeConnectStatus | null) {
  if (!status) return "pending";
  if (status.missingSchema) return "error";
  if (!status.stripeAccountId) return "needs_setup";
  if (status.chargesEnabled && status.payoutsEnabled) return "ready";
  return "in_progress";
}

export default function AdminPaymentSettingsPage() {
  const router = useRouter();
  const { selectedClub, loading: clubLoading } = useClub();
  const { canManageSelectedClub } = useAdminClubPageAccess();

  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<"onboard" | "dashboard" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!selectedClub?.id) return;
    setLoading(true);
    setError(null);
    try {
      const stripeStatus = await StripeConnectService.getClubStatus(selectedClub.id);
      setStatus(stripeStatus);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load Stripe Connect status."
      );
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClub?.id]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const severity = getSeverity(status);
  const basePath = env.BASE_PATH ?? "/app";

  const statusPill = useMemo(() => {
    if (severity === "ready") {
      return <Badge className="bg-green-600">Ready for online payments</Badge>;
    }
    if (severity === "in_progress") {
      return <Badge variant="secondary">Onboarding in progress</Badge>;
    }
    if (severity === "error") {
      return <Badge variant="destructive">Configuration required</Badge>;
    }
    if (severity === "needs_setup") {
      return <Badge variant="secondary">Stripe not connected</Badge>;
    }
    return <Badge variant="outline">Loading status</Badge>;
  }, [severity]);

  const handleStartOrResumeOnboarding = async () => {
    if (!selectedClub?.id) return;
    setBusyAction("onboard");
    setError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const returnUrl = `${origin}${basePath}/admin/payments/settings?stripe=return`;
      const refreshUrl = `${origin}${basePath}/admin/payments/settings?stripe=refresh`;
      const { url } = await StripeConnectService.createOnboardingLink({
        clubId: selectedClub.id,
        returnUrl,
        refreshUrl,
      });
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start Stripe onboarding. Check edge function wiring."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenDashboard = async () => {
    if (!selectedClub?.id) return;
    setBusyAction("dashboard");
    setError(null);
    try {
      const { url } = await StripeConnectService.createDashboardLink(selectedClub.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not open Stripe dashboard. Check edge function wiring."
      );
    } finally {
      setBusyAction(null);
    }
  };

  if (clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="mx-auto" />
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="flex-1 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Payment Settings</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Select a club before managing Stripe Connect settings.
            </p>
            <Button variant="outline" asChild>
              <Link href="/admin/club-management">Go to Club Management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageSelectedClub) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium text-destructive">Access denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            You do not have permission to manage payment settings for this club.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Settings</h1>
          <p className="text-muted-foreground">
            Configure Stripe Connect for {selectedClub.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/payments">Back to Payments</Link>
          </Button>
          <Button variant="outline" onClick={() => router.refresh()}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect status</CardTitle>
          <CardDescription>
            Each club needs its own connected Stripe account to accept online payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Stripe status...
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {statusPill}
                {status?.stripeAccountId ? (
                  <Badge variant="outline" className="font-mono">
                    {status.stripeAccountId}
                  </Badge>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Charges</p>
                  <p className="text-sm font-medium">
                    {status?.chargesEnabled ? "Enabled" : "Not enabled"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Payouts</p>
                  <p className="text-sm font-medium">
                    {status?.payoutsEnabled ? "Enabled" : "Not enabled"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleStartOrResumeOnboarding}
                  disabled={busyAction != null}
                >
                  {busyAction === "onboard" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : status?.stripeAccountId ? (
                    "Resume Stripe onboarding"
                  ) : (
                    "Connect Stripe"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleOpenDashboard}
                  disabled={busyAction != null || !status?.stripeAccountId}
                >
                  {busyAction === "dashboard" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Stripe dashboard
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {status?.missingSchema ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium">
                    Club Stripe fields are missing in the database schema.
                  </p>
                  <p className="text-xs mt-1">
                    Add Stripe Connect columns to `clubs` (e.g. account id, charges/payouts enabled)
                    before this page can show live status.
                  </p>
                  {status.schemaErrorMessage ? (
                    <p className="text-xs mt-1 opacity-90">{status.schemaErrorMessage}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
