"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { useClub } from "@/lib/club-context";
import { useAdminClubPageAccess } from "@/lib/hooks/use-admin-club-page-access";

export default function AdminSettingsPage() {
  const { selectedClub, loading: clubLoading } = useClub();
  const { globalAdmin, canManageSelectedClub } = useAdminClubPageAccess();

  const initial = useMemo(() => ({
    name: "Your Club Name",
    subdomain: "your-club",
    contactEmail: "admin@yourclub.com",
    contactPhone: "",
  }), []);

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
          <h1 className="text-3xl font-bold text-foreground">Club Settings</h1>
          <p className="text-muted-foreground">Configure club information and preferences</p>
        </div>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <h3 className="text-lg font-medium mb-2">Select a club</h3>
            <p className="text-muted-foreground mb-6">
              Choose a club from the switcher to edit its settings.
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
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Club Settings</h1>
        <p className="text-muted-foreground">Configure club information and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Club Name</Label>
              <Input id="name" defaultValue={initial.name} />
            </div>
            <div>
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input id="subdomain" defaultValue={initial.subdomain} />
            </div>
            <div>
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" type="email" defaultValue={initial.contactEmail} />
            </div>
            <div>
              <Label htmlFor="phone">Contact Phone</Label>
              <Input id="phone" defaultValue={initial.contactPhone} />
            </div>
          </div>
          <div>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


