"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function AdminRolesPage() {
  return (
    <div className="flex-1 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">User Roles</h1>
      <Card>
        <CardContent className="text-center py-16 px-6">
          <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">User roles coming soon</h3>
          <p className="text-muted-foreground mb-6">
            Role management and permissions are under development. Check back later.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/club-management">Go to Club Management</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
