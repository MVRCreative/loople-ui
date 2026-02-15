"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useClub } from "@/lib/club-context";
import { ProgramsService } from "@/lib/services/programs.service";
import { useProgramMembership } from "@/lib/programs/hooks";
import type {
  ProgramWithMemberCount,
  ProgramMembershipWithMember,
} from "@/lib/programs/types";
import {
  Users,
  DollarSign,
  Calendar,
  ArrowLeft,
  Eye,
  Lock,
  Layers,
  LogIn,
  LogOut,
  Loader2,
} from "lucide-react";

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.programId as string;
  const { loading: clubLoading } = useClub();

  const [program, setProgram] = useState<ProgramWithMemberCount | null>(null);
  const [members, setMembers] = useState<ProgramMembershipWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    isMember,
    loading: membershipLoading,
    memberId,
    join,
    leave,
    refresh: refreshMembership,
  } = useProgramMembership(programId);

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

  const handleJoin = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await join();
      // Refresh data
      await Promise.all([loadProgram(), refreshMembership()]);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to join program"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await leave();
      await Promise.all([loadProgram(), refreshMembership()]);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to leave program"
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (clubLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <Loader className="mx-auto" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center py-16">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-destructive mb-4">
            {error ?? "Program not found"}
          </p>
          <Button asChild>
            <Link href="/programs">Back to Programs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isFull =
    program.max_members != null &&
    program.member_count >= program.max_members;
  const isFree = !program.has_fees || !program.registration_fee;
  const canJoin = !isMember && !isFull && memberId != null;

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/programs">
          <ArrowLeft className="h-4 w-4 mr-1" />
          All Programs
        </Link>
      </Button>

      {/* Banner */}
      <div
        className="h-48 sm:h-56 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 relative overflow-hidden"
        style={
          program.image_url
            ? {
                backgroundImage: `url(${program.image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30 capitalize text-sm">
              {program.program_type}
            </Badge>
            {program.visibility !== "public" && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {program.visibility === "members_only" ? (
                  <Eye className="h-3 w-3 mr-1" />
                ) : (
                  <Lock className="h-3 w-3 mr-1" />
                )}
                {program.visibility === "members_only"
                  ? "Members Only"
                  : "Private"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Title + Join */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{program.name}</h1>
          {program.description && (
            <p className="text-muted-foreground mt-1 max-w-2xl">
              {program.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {membershipLoading ? (
            <Button disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Loading...
            </Button>
          ) : isMember ? (
            <Button
              variant="outline"
              onClick={handleLeave}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <LogOut className="h-4 w-4 mr-1" />
              )}
              Leave Program
            </Button>
          ) : canJoin ? (
            <Button onClick={handleJoin} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <LogIn className="h-4 w-4 mr-1" />
              )}
              {isFree ? "Join for Free" : `Join \u2014 $${program.registration_fee}`}
            </Button>
          ) : isFull ? (
            <Button disabled>Program Full</Button>
          ) : memberId == null ? (
            <p className="text-sm text-muted-foreground">
              You must be a club member to join programs
            </p>
          ) : null}

          {actionError && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="text-lg font-bold">
                {program.member_count}
                {program.max_members ? ` / ${program.max_members}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Fee</p>
              <p className="text-lg font-bold">
                {isFree ? "Free" : `$${program.registration_fee}`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-lg font-bold capitalize">
                {program.program_type}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Season</p>
              <p className="text-sm font-semibold">
                {program.season_start
                  ? `${formatDate(program.season_start)}`
                  : "Year-round"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {m.member.first_name[0]}
                    {m.member.last_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {m.member.first_name} {m.member.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {m.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No members yet. Be the first to join!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
