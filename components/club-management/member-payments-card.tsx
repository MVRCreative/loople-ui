"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

interface MemberPaymentsCardProps {
  memberId: string;
}

export function MemberPaymentsCard({ memberId }: MemberPaymentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <CreditCard className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">Payment history coming soon</p>
          <p className="text-xs mt-1">
            This will show dues, program fees, and other transactions for this member.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
