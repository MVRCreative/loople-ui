"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminSecurityPage() {
  return (
    <div className="flex-1 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Security</h1>
      <Card>
        <CardContent className="text-center py-16 px-6">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Security settings coming soon</h3>
          <p className="text-muted-foreground mb-6">
            Security and access control settings are under development. Check back later.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/club-management">Go to Club Management</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
