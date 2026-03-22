"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useClub } from "@/lib/club-context";
import { useAdminClubPageAccess } from "@/lib/hooks/use-admin-club-page-access";
import { PaymentsTable } from "@/components/club-management/payments-table";
import type { Payment } from "@/lib/types/club-management";

function buildPlaceholderPayments(clubId: string): Payment[] {
  return [
    {
      id: "1",
      clubId,
      registrationId: "reg-1",
      stripePaymentIntentId: "pi_sample_summer_championship",
      amount: 150,
      feeAmount: 4.5,
      paymentMethod: "card",
      status: "completed",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      registration: {
        member: { firstName: "Emma", lastName: "Wilson" },
        event: { title: "Summer Championship" },
      },
    },
    {
      id: "2",
      clubId,
      registrationId: "reg-2",
      amount: 50,
      paymentMethod: "card",
      status: "pending",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      registration: {
        member: { firstName: "Michael", lastName: "Foster" },
        event: { title: "Practice Session" },
      },
    },
    {
      id: "3",
      clubId,
      registrationId: "reg-3",
      stripePaymentIntentId: "pi_sample_clinic",
      amount: 75,
      paymentMethod: "cash",
      status: "completed",
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      registration: {
        member: { firstName: "Jordan", lastName: "Lee" },
        event: { title: "Stroke Clinic" },
      },
    },
  ];
}

export default function AdminPaymentsPage() {
  const { selectedClub, loading: clubLoading } = useClub();
  const { globalAdmin, canManageSelectedClub } = useAdminClubPageAccess();

  const payments = useMemo(() => {
    const clubId = selectedClub?.id ? String(selectedClub.id) : "demo";
    return buildPlaceholderPayments(clubId);
  }, [selectedClub?.id]);

  if (clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="mx-auto" />
      </div>
    );
  }

  if (!globalAdmin && !selectedClub) {
    return (
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">Track payments and financial transactions</p>
        </div>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <h3 className="text-lg font-medium mb-2">Select a club</h3>
            <p className="text-muted-foreground mb-6">
              Choose a club from the switcher to view payment activity in context.
            </p>
            <Button variant="outline" asChild>
              <Link href="/admin/club-management">Club management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedClub && !canManageSelectedClub) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium text-destructive">Access denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            You don&apos;t have permission to manage this club.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Payments
        </h1>
        <p className="text-sm text-muted-foreground">
          {selectedClub
            ? `Transactions for ${selectedClub.name}.`
            : "All transactions (global view)."}
        </p>
      </header>

      <PaymentsTable payments={payments} flush />
    </div>
  );
}


