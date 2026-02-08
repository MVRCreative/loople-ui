"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { supabase } from "@/lib/supabase";
import { getFunctionsUrl } from "@/lib/supabase";
import { env } from "@/lib/env";

interface ClubInfo {
  id: string;
  name: string;
  waitlist_enabled: boolean;
  waitlist_payment_amount: number | null;
}

function WaitlistApplyForm() {
  const searchParams = useSearchParams();
  const clubId = searchParams.get("club") ?? searchParams.get("clubId") ?? "";

  const [club, setClub] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) {
      setError("Missing club. Use ?club=CLUB_ID or ?club=subdomain in the URL.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const isNumeric = /^\d+$/.test(clubId);
        let query = supabase
          .from("clubs")
          .select("id, name, waitlist_enabled, waitlist_payment_amount");
        query = isNumeric ? query.eq("id", clubId) : query.eq("subdomain", clubId);
        const { data, error: fetchErr } = await query.maybeSingle();

        if (fetchErr || !data) {
          setError("Club not found.");
          setClub(null);
          return;
        }
        setClub({
          id: String(data.id),
          name: data.name ?? "Club",
          waitlist_enabled: Boolean(data.waitlist_enabled),
          waitlist_payment_amount: data.waitlist_payment_amount != null ? Number(data.waitlist_payment_amount) : null,
        });
      } catch {
        setError("Failed to load club.");
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club?.id || !club.waitlist_enabled) return;

    setSubmitting(true);
    setError(null);

    try {
      const url = `${getFunctionsUrl()}/waitlist-create-payment-intent`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: club.id,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || undefined,
          amount: club.waitlist_payment_amount ?? 0,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }

      if (json.no_payment) {
        setSuccess(true);
        return;
      }

      if (json.client_secret) {
        setClientSecret(json.client_secret);
        return;
      }

      setError("Unexpected response.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="mx-auto" />
      </div>
    );
  }

  if (!clubId || error || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Waitlist</CardTitle>
            <CardDescription>{error ?? "Invalid link."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Go home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!club.waitlist_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Waitlist closed</CardTitle>
            <CardDescription>
              The waitlist for {club.name} is not currently accepting applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Go home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Application received</CardTitle>
            <CardDescription>
              Thank you! Your waitlist application for {club.name} has been submitted. You will be notified when a
              spot becomes available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">Go home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <StripePaymentForm
        clientSecret={clientSecret}
        clubName={club.name}
        onSuccess={() => setSuccess(true)}
        onBack={() => setClientSecret(null)}
      />
    );
  }

  const amount = club.waitlist_payment_amount ?? 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Join the waitlist</CardTitle>
          <CardDescription>
            {club.name} — {amount > 0 ? `Registration fee: $${amount}` : "No fee required"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : amount > 0 ? "Continue to payment" : "Submit application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function StripePaymentForm({
  clientSecret,
  clubName,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  clubName: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const publishableKey = env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>
              Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Complete payment</CardTitle>
          <CardDescription>{clubName} — waitlist registration</CardDescription>
        </CardHeader>
        <CardContent>
          <StripePaymentElement
            clientSecret={clientSecret}
            publishableKey={publishableKey}
            onSuccess={onSuccess}
            onBack={onBack}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StripePaymentElement({
  clientSecret,
  publishableKey,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  publishableKey: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [stripePromise] = useState(() => loadStripe(publishableKey));

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormInner clientSecret={clientSecret} onSuccess={onSuccess} onBack={onBack} />
    </Elements>
  );
}

function PaymentFormInner({
  clientSecret,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);
    try {
      const basePath = typeof window !== "undefined" ? (env.BASE_PATH || "/app") : "/app";
      const returnUrl = typeof window !== "undefined" ? `${window.location.origin}${basePath}/waitlist/apply/success` : "";
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
      });

      if (stripeError) {
        setError(stripeError.message ?? "Payment failed");
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Pay"}
        </Button>
      </div>
    </form>
  );
}

export default function WaitlistApplyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image src="/app/loople-logo3.svg" alt="Loople" width={140} height={60} />
        </Link>
      </header>
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader /></div>}>
        <WaitlistApplyForm />
      </Suspense>
    </div>
  );
}
