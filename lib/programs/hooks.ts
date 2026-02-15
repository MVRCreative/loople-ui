"use client";

import { useState, useEffect, useCallback } from "react";
import { useClub } from "@/lib/club-context";
import { supabase } from "@/lib/supabase";
import { ProgramsService } from "@/lib/services/programs.service";
import type {
  ProgramWithMemberCount,
  ProgramMembership,
} from "@/lib/programs/types";

/**
 * Returns the member_id for the currently authenticated user in the selected club.
 * Needed to join/leave programs (program_memberships references members.id).
 */
export function useCurrentMemberId() {
  const { selectedClub } = useClub();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!selectedClub) {
        setMemberId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          setMemberId(null);
          return;
        }

        const { data } = await supabase
          .from("members")
          .select("id")
          .eq("club_id", selectedClub.id)
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!cancelled) {
          setMemberId(data?.id != null ? String(data.id) : null);
        }
      } catch {
        if (!cancelled) setMemberId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [selectedClub]);

  return { memberId, loading };
}

/** Fetch all programs for the selected club */
export function useClubPrograms() {
  const { selectedClub, loading: clubLoading } = useClub();
  const [programs, setPrograms] = useState<ProgramWithMemberCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selectedClub) {
      setPrograms([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ProgramsService.getPrograms(String(selectedClub.id));
      setPrograms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [selectedClub]);

  useEffect(() => {
    if (!clubLoading && selectedClub) {
      load();
    }
  }, [clubLoading, selectedClub, load]);

  return { programs, loading: loading || clubLoading, error, reload: load };
}

/** Membership status for the current user on a specific program */
export function useProgramMembership(programId: string) {
  const { memberId, loading: memberLoading } = useCurrentMemberId();
  const [membership, setMembership] = useState<ProgramMembership | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    if (!memberId || !programId) {
      setMembership(null);
      return;
    }
    setLoading(true);
    try {
      const status = await ProgramsService.getMembershipStatus(
        programId,
        memberId
      );
      setMembership(status);
    } catch {
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, [memberId, programId]);

  useEffect(() => {
    if (!memberLoading) {
      check();
    }
  }, [memberLoading, check]);

  const join = useCallback(async () => {
    if (!memberId) throw new Error("Not a member of this club");
    const result = await ProgramsService.joinProgram(programId, memberId);
    setMembership(result);
    return result;
  }, [programId, memberId]);

  const leave = useCallback(async () => {
    if (!memberId) return;
    await ProgramsService.leaveProgram(programId, memberId);
    setMembership(null);
  }, [programId, memberId]);

  return {
    membership,
    isMember: membership != null && membership.status === "active",
    loading: loading || memberLoading,
    memberId,
    join,
    leave,
    refresh: check,
  };
}
