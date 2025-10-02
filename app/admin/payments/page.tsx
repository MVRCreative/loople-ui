"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";

export default function AdminPaymentsPage() {
  const { user: authUser } = useAuth();
  const [query, setQuery] = useState("");

  const currentUser: User = authUser ? convertAuthUserToUser(authUser) : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  const payments = useMemo(() => {
    // Placeholder sample data; replace with PaymentsService when wiring backend
    return [
      { id: "1", amount: 150, status: "completed", member: "Emma Wilson", event: "Summer Championship" },
      { id: "2", amount: 50, status: "pending", member: "Michael Foster", event: "Practice Session" },
    ].filter((p) => `${p.member} ${p.event}`.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">Track payments and financial transactions</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by member or event..." className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.member}</CardTitle>
                <Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "secondary" : "outline"}>{p.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-1">{p.event}</div>
              <div className="text-foreground font-medium">${p.amount}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


