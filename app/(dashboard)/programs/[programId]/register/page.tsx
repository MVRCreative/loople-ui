"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Users } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useClub } from "@/lib/club-context";
import { useCurrentMemberId } from "@/lib/programs/hooks";
import { ProgramsService } from "@/lib/services/programs.service";
import { PaymentsService } from "@/lib/services/payments.service";
import { MembersService, type Member } from "@/lib/services/members.service";
import { EventsService, type Event } from "@/lib/services/events.service";
import type { ProgramWithMemberCount, ProgramMembership } from "@/lib/programs/types";
import { env } from "@/lib/env";

type Step = 1 | 2 | 3 | 4;

export default function ProgramRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const { loading: clubLoading } = useClub();
  const programId = params.programId as string;
  const { memberId: currentMemberId, loading: memberLoading } = useCurrentMemberId();

  const [program, setProgram] = useState<ProgramWithMemberCount | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [existingMemberships, setExistingMemberships] = useState<
    Record<string, ProgramMembership>
  >({});
  const [programEvents, setProgramEvents] = useState<Event[]>([]);
  const [selectedEventsByMember, setSelectedEventsByMember] = useState<
    Record<string, string[]>
  >({});
  const [step, setStep] = useState<Step>(1);
  const [acknowledgedReview, setAcknowledgedReview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingMemberIds, setPendingMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRegistrationContext = useCallback(async () => {
    if (!currentMemberId) return;

    setLoading(true);
    setError(null);
    try {
      const [programData, currentMember] = await Promise.all([
        ProgramsService.getProgramById(programId),
        MembersService.getMemberById(currentMemberId),
      ]);

      if (!programData) {
        setError("Program not found");
        setProgram(null);
        return;
      }
      if (!currentMember) {
        setError("Could not resolve your member profile for registration.");
        setProgram(programData);
        return;
      }

      const [family, events] = await Promise.all([
        MembersService.getFamilyForMember(currentMember),
        EventsService.getEvents({
          club_id: programData.club_id,
          program_id: Number(programId),
          is_active: true,
          sort_by: "start_date",
          sort_order: "asc",
        }),
      ]);

      const members = [currentMember, ...family]
        .filter(
          (member, index, arr) =>
            arr.findIndex((candidate) => candidate.id === member.id) === index
        )
        .sort((a, b) =>
          `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          )
        );

      const [memberships, savedSelections] = await Promise.all([
        ProgramsService.getProgramMembershipsForMembers(
          programId,
          members.map((m) => m.id)
        ),
        ProgramsService.getRegistrationEventSelections(
          programId,
          members.map((m) => m.id)
        ).catch(() => []),
      ]);

      const membershipByMemberId = Object.fromEntries(
        memberships.map((membership) => [membership.member_id, membership])
      ) as Record<string, ProgramMembership>;

      const defaultSelected = members
        .filter((member) => !membershipByMemberId[member.id])
        .map((member) => member.id);

      const selectionsByMember: Record<string, string[]> = {};
      for (const selection of savedSelections) {
        if (!selectionsByMember[selection.member_id]) {
          selectionsByMember[selection.member_id] = [];
        }
        selectionsByMember[selection.member_id].push(selection.event_id);
      }

      const defaultSelections = Object.fromEntries(
        members.map((member) => [member.id, selectionsByMember[member.id] ?? []])
      );

      setProgram(programData);
      setProgramEvents(
        events.filter((event) => new Date(event.end_date).getTime() >= Date.now())
      );
      setFamilyMembers(members);
      setExistingMemberships(membershipByMemberId);
      setSelectedMemberIds(defaultSelected);
      setSelectedEventsByMember(defaultSelections);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load registration details."
      );
    } finally {
      setLoading(false);
    }
  }, [currentMemberId, programId]);

  useEffect(() => {
    if (!clubLoading && !memberLoading && currentMemberId) {
      void loadRegistrationContext();
    } else if (!clubLoading && !memberLoading && !currentMemberId) {
      setLoading(false);
      setError("You must be a club member to register for programs.");
    }
  }, [clubLoading, memberLoading, currentMemberId, loadRegistrationContext]);

  const isFeeProgram = !!program?.has_fees && !!program.registration_fee;

  const filteredMembers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return familyMembers;
    return familyMembers.filter((member) =>
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(term)
    );
  }, [familyMembers, searchQuery]);

  const selectedMembers = familyMembers.filter((member) =>
    selectedMemberIds.includes(member.id)
  );
  const totalSelectedEvents = useMemo(
    () =>
      selectedMembers.reduce(
        (count, member) => count + (selectedEventsByMember[member.id]?.length ?? 0),
        0
      ),
    [selectedEventsByMember, selectedMembers]
  );
  const currentStep = clientSecret ? 4 : step;

  const totalAmount = useMemo(() => {
    if (!program?.registration_fee || selectedMemberIds.length === 0) return 0;
    return Number(program.registration_fee) * selectedMemberIds.length;
  }, [program?.registration_fee, selectedMemberIds.length]);

  const canSubmitRegistration = selectedMembers.length > 0;

  const toggleMemberSelection = (memberId: string) => {
    if (existingMemberships[memberId]) return;
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleMemberEventSelection = (memberId: string, eventId: string) => {
    setSelectedEventsByMember((prev) => {
      const current = prev[memberId] ?? [];
      const next = current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId];
      return { ...prev, [memberId]: next };
    });
  };

  const setAllEventsForMember = (memberId: string) => {
    setSelectedEventsByMember((prev) => ({
      ...prev,
      [memberId]: programEvents.map((event) => String(event.id)),
    }));
  };

  const clearEventsForMember = (memberId: string) => {
    setSelectedEventsByMember((prev) => ({ ...prev, [memberId]: [] }));
  };

  useEffect(() => {
    setSelectedEventsByMember((prev) => {
      const next = { ...prev };
      for (const memberId of selectedMemberIds) {
        if (!next[memberId]) {
          next[memberId] = [];
        }
      }
      return next;
    });
  }, [selectedMemberIds]);

  const handleSubmitRegistration = async () => {
    if (!program || !canSubmitRegistration || !acknowledgedReview) return;

    setSubmitting(true);
    setError(null);
    try {
      const selectedIds = selectedMembers.map((member) => member.id);
      const selectionsPayload = Object.fromEntries(
        selectedIds.map((memberId) => [
          memberId,
          selectedEventsByMember[memberId] ?? [],
        ])
      );

      if (isFeeProgram) {
        await ProgramsService.registerMembers(program.id, selectedIds, {
          paymentStatus: "pending",
          membershipStatus: "active",
          role: "participant",
        });
        await ProgramsService.upsertRegistrationEventSelections(
          program.id,
          selectionsPayload
        );
        setPendingMemberIds(selectedIds);

        const paymentIntent = (await PaymentsService.createStripePaymentIntent(
          totalAmount,
          "usd"
        )) as { client_secret?: string } | null;

        if (!paymentIntent?.client_secret) {
          router.push(
            `/programs/${program.id}?registration=pending-payment&members=${selectedIds.length}`
          );
          router.refresh();
          return;
        }

        setClientSecret(paymentIntent.client_secret);
        setStep(4);
      } else {
        await ProgramsService.registerMembers(program.id, selectedIds, {
          paymentStatus: "free",
          membershipStatus: "active",
          role: "participant",
        });
        await ProgramsService.upsertRegistrationEventSelections(
          program.id,
          selectionsPayload
        );
        router.push(
          `/programs/${program.id}?registration=success&members=${selectedIds.length}`
        );
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete registration."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSucceeded = async () => {
    if (!program || pendingMemberIds.length === 0) return;
    try {
      await ProgramsService.updateMembershipPaymentStatus(
        program.id,
        pendingMemberIds,
        "paid"
      );
      router.push(
        `/programs/${program.id}?registration=success&members=${pendingMemberIds.length}`
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment succeeded, but membership finalization failed."
      );
    }
  };

  if (clubLoading || memberLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <Loader className="mx-auto" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive mb-4">{error ?? "Program not found."}</p>
            <Button asChild>
              <Link href="/programs">Back to Programs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <ProgramPaymentStep
        clientSecret={clientSecret}
        onBack={() => {
          setClientSecret(null);
          setStep(3);
        }}
        onSuccess={handlePaymentSucceeded}
      />
    );
  }

  const formatEventDate = (value: string) =>
    new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/programs/${program.id}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Program
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Register for {program.name}</h1>
        <p className="text-muted-foreground">
          Choose registrants, select events per person, review acknowledgment, then pay.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((value) => {
          const stepValue = value as Step;
          const isComplete = currentStep > stepValue;
          const isCurrent = currentStep === stepValue;
          return (
            <Card key={value} className={isCurrent ? "border-primary" : undefined}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-7 w-7 rounded-full border flex items-center justify-center text-sm font-semibold">
                  {isComplete ? <CheckCircle2 className="h-4 w-4 text-primary" /> : value}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {value === 1
                      ? "Select members"
                      : value === 2
                        ? "Select events"
                        : value === 3
                          ? "Review"
                          : "Payment"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Who are you registering?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search family members..."
            />

            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const membership = existingMemberships[member.id];
                const disabled = !!membership;
                const checked = selectedMemberIds.includes(member.id) || disabled;
                const membershipLabel = membership
                  ? `${membership.status} (${membership.payment_status})`
                  : null;

                return (
                  <button
                    key={member.id}
                    type="button"
                    className="w-full rounded-lg border p-3 text-left transition hover:bg-muted/50 disabled:opacity-70"
                    onClick={() => toggleMemberSelection(member.id)}
                    disabled={disabled}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {member.member_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {membershipLabel ? (
                          <Badge variant="secondary" className="capitalize">
                            Already registered: {membershipLabel}
                          </Badge>
                        ) : null}
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={checked}
                          readOnly
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canSubmitRegistration}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select events per registrant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No registrants selected. Go back and choose at least one member.
              </p>
            ) : programEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No program events are currently scheduled. You can continue to review.
              </p>
            ) : (
              <div className="space-y-5">
                {selectedMembers.map((member) => {
                  const selectedIds = selectedEventsByMember[member.id] ?? [];
                  return (
                    <div key={member.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedIds.length} event
                            {selectedIds.length === 1 ? "" : "s"} selected
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAllEventsForMember(member.id)}
                          >
                            Select all
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => clearEventsForMember(member.id)}
                          >
                            Clear all
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {programEvents.map((event) => {
                          const eventId = String(event.id);
                          const checked = selectedIds.includes(eventId);
                          return (
                            <label
                              key={event.id}
                              className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40"
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 accent-primary"
                                checked={checked}
                                onChange={() =>
                                  toggleMemberEventSelection(member.id, eventId)
                                }
                              />
                              <div>
                                <p className="text-sm font-medium">{event.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatEventDate(event.start_date)}
                                  {event.location ? ` · ${event.location}` : ""}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Participants</p>
              <ul className="space-y-1">
                {selectedMembers.map((member) => (
                  <li key={member.id} className="text-sm">
                    {member.first_name} {member.last_name}
                    <span className="text-muted-foreground">
                      {" "}
                      — {(selectedEventsByMember[member.id] ?? []).length} events selected
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm text-muted-foreground">Payment</p>
              {isFeeProgram ? (
                <p className="font-semibold">${totalAmount.toFixed(2)} total</p>
              ) : (
                <p className="font-semibold">No payment required</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Selected events ({totalSelectedEvents}) do not change the total.
              </p>
              {isFeeProgram ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Registrations are created with pending payment and can be finalized
                  in checkout.
                </p>
              ) : null}
            </div>

            <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary"
                checked={acknowledgedReview}
                onChange={(event) => setAcknowledgedReview(event.target.checked)}
              />
              <span className="text-sm">
                I confirm the selected registrants and event choices are correct and I
                understand payment is based on the base program registration fee.
              </span>
            </label>

            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleSubmitRegistration}
                disabled={submitting || !canSubmitRegistration || !acknowledgedReview}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : isFeeProgram ? (
                  "Continue to Payment"
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProgramPaymentStep({
  clientSecret,
  onBack,
  onSuccess,
}: {
  clientSecret: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const publishableKey = env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Stripe not configured</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Registrations were created
              with pending payment status.
            </p>
            <Button variant="outline" onClick={onBack}>
              Back to review
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Complete payment</CardTitle>
        </CardHeader>
        <CardContent>
          <Elements
            stripe={loadStripe(publishableKey)}
            options={{ clientSecret }}
          >
            <ProgramPaymentElement
              clientSecret={clientSecret}
              onBack={onBack}
              onSuccess={onSuccess}
            />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgramPaymentElement({
  clientSecret,
  onBack,
  onSuccess,
}: {
  clientSecret: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message ?? "Payment failed.");
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        onSuccess();
        return;
      }

      setError("Payment is still processing. Please try again shortly.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            "Pay now"
          )}
        </Button>
      </div>
    </form>
  );
}
