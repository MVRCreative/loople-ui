"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { ProgramsService } from "@/lib/services/programs.service";
import { ProgramForm } from "@/components/programs/program-form";
import type { Program } from "@/lib/programs/types";
import type { User } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

export default function EditProgramPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const { user: authUser } = useAuth();
  const { selectedClub, loading: clubLoading } = useClub();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser: User = authUser
    ? convertAuthUserToUser(authUser)
    : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  const loadProgram = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ProgramsService.getProgramById(programId);
      setProgram(data);
    } catch (err) {
      console.error("Error loading program:", err);
      setError(err instanceof Error ? err.message : "Failed to load program");
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    if (!clubLoading) {
      loadProgram();
    }
  }, [clubLoading, loadProgram]);

  if (clubLoading || loading) {
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

  if (error || !program) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            {error ?? "Program not found"}
          </p>
          <Button
            onClick={() => router.push("/admin/programs")}
            className="mt-4"
          >
            Back to Programs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/programs/${programId}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Program
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Program</h1>
        <p className="text-muted-foreground">
          Update settings for {program.name}
        </p>
      </div>

      <ProgramForm
        clubId={String(selectedClub?.id ?? program.club_id)}
        program={program}
        mode="edit"
      />
    </div>
  );
}
