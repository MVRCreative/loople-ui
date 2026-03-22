"use client";

import { useClub } from "@/lib/club-context";
import { useAdminClubPageAccess } from "@/lib/hooks/use-admin-club-page-access";
import { ProgramForm } from "@/components/programs/program-form";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import Link from "next/link";

export default function CreateProgramPage() {
  const { selectedClub, loading: clubLoading } = useClub();
  const { canManageSelectedClub } = useAdminClubPageAccess();

  if (clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="mx-auto" />
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

  if (!canManageSelectedClub) {
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
        <h1 className="text-3xl font-bold text-foreground">Create Program</h1>
        <p className="text-muted-foreground">
          Set up a new program for {selectedClub.name}
        </p>
      </div>

      <ProgramForm clubId={String(selectedClub.id)} mode="create" />
    </div>
  );
}
