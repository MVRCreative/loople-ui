"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";

export default function AdminSettingsPage() {
  const { user: authUser } = useAuth();
  const currentUser: User = authUser ? convertAuthUserToUser(authUser) : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  const initial = useMemo(() => ({
    name: "Your Club Name",
    subdomain: "your-club",
    contactEmail: "admin@yourclub.com",
    contactPhone: "",
  }), []);

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


