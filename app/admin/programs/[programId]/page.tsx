"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { ProgramsService } from "@/lib/services/programs.service";
import type { ProgramWithMemberCount, ProgramMembershipWithMember } from "@/lib/programs/types";
import type { User } from "@/lib/types";
import {
  Edit,
  Trash2,
  Users,
  DollarSign,
  Calendar,
  ArrowLeft,
  Eye,
  Lock,
  Layers,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const { user: authUser } = useAuth();
  const { loading: clubLoading } = useClub();

  const [program, setProgram] = useState<ProgramWithMemberCount | null>(null);
  const [members, setMembers] = useState<ProgramMembershipWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser: User = authUser
    ? convertAuthUserToUser(authUser)
    : createGuestUser();
  const isAdmin = currentUser.isAdmin;

  const loadProgram = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [programData, memberData] = await Promise.all([
        ProgramsService.getProgramById(programId),
        ProgramsService.getProgramMembers(programId),
      ]);
      setProgram(programData);
      setMembers(memberData);
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ProgramsService.deleteProgram(programId);
      router.push("/admin/programs");
    } catch (err) {
      console.error("Error deleting program:", err);
      setError(err instanceof Error ? err.message : "Failed to delete program");
    } finally {
      setDeleting(false);
    }
  };

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
          <Button onClick={() => router.push("/admin/programs")} className="mt-4">
            Back to Programs
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/programs">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Programs
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground">
              {program.name}
            </h1>
            <Badge variant={program.is_active ? "default" : "secondary"}>
              {program.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {program.description && (
            <p className="text-muted-foreground max-w-2xl">
              {program.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/programs/${programId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={deleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Program</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{program.name}&quot; and
                  remove all member enrollments. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-2xl font-bold">
                {program.member_count}
                {program.max_members ? ` / ${program.max_members}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="text-lg font-semibold capitalize">
                {program.program_type}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {program.visibility === "public" ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visibility</p>
              <p className="text-lg font-semibold capitalize">
                {program.visibility.replace("_", " ")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fee</p>
              <p className="text-lg font-semibold">
                {program.has_fees && program.registration_fee
                  ? `$${program.registration_fee}`
                  : "Free"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Season Info */}
      {(program.season_start || program.season_end) && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Season: {formatDate(program.season_start)} &mdash;{" "}
              {formatDate(program.season_end)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        {m.member.first_name} {m.member.last_name}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {m.member.email ?? "—"}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="capitalize">
                          {m.role}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            m.status === "active" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {m.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(m.joined_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No members yet</p>
              <p className="text-sm text-muted-foreground">
                Members can join this program from the programs page
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
