"use client";

import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { ProgramForm } from "@/components/programs/program-form";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import Link from "next/link";
import type { User } from "@/lib/types";

export default function CreateProgramPage() {
  const { user: authUser } = useAuth();
  const { selectedClub, loading: clubLoading } = useClub();

  const currentUser: User = authUser
    ? convertAuthUserToUser(authUser)
    : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  if (clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="mx-auto" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-lg font-medium text-destructive">Access Denied</p>
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="flex-1 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Create Program</h1>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Select a club first
            </h3>
            <Button asChild>
              <Link href="/admin/club-management">Go to Club Management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create Program</h1>
        <p className="text-muted-foreground">
          Set up a new program for {selectedClub.name}
        </p>
      </div>

      <div className="max-w-2xl">
        <ProgramForm clubId={String(selectedClub.id)} mode="create" />
      </div>
    </div>
  );
}
