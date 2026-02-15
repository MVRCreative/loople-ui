import { supabase } from "../supabase";
import type {
  Program,
  ProgramWithMemberCount,
  ProgramMembership,
  ProgramMembershipWithMember,
  ProgramScheduleEntry,
  CreateProgramData,
  UpdateProgramData,
} from "../programs/types";

/**
 * ProgramsService
 *
 * Full CRUD for programs + join/leave membership management.
 * Uses direct Supabase queries (no edge function required for now).
 */
export class ProgramsService {
  // ---------------------------------------------------------------------------
  // Programs CRUD
  // ---------------------------------------------------------------------------

  /** List all programs for a club, with a member count */
  static async getPrograms(clubId: string): Promise<ProgramWithMemberCount[]> {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*, program_memberships(count)")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching programs:", error);
        throw error;
      }

      return (data ?? []).map((row) => this.mapRowToProgram(row));
    } catch (error) {
      console.error("Error in getPrograms:", error);
      throw error;
    }
  }

  /** Get a single program by ID, with member count */
  static async getProgramById(
    programId: string
  ): Promise<ProgramWithMemberCount | null> {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*, program_memberships(count)")
        .eq("id", programId)
        .single();

      if (error) {
        if ((error as { code?: string }).code === "PGRST116") return null;
        console.error("Error fetching program:", error);
        throw error;
      }

      if (!data) return null;
      return this.mapRowToProgram(data);
    } catch (error) {
      console.error("Error in getProgramById:", error);
      throw error;
    }
  }

  /** Create a new program */
  static async createProgram(
    programData: CreateProgramData
  ): Promise<Program> {
    try {
      const payload: Record<string, unknown> = { ...programData };

      // Coerce club_id to number if numeric
      if (
        payload.club_id != null &&
        /^\d+$/.test(String(payload.club_id))
      ) {
        payload.club_id = Number(payload.club_id);
      }

      // Remove empty-string optional fields
      const optionalKeys = [
        "description",
        "season_start",
        "season_end",
        "image_url",
      ];
      for (const key of optionalKeys) {
        if (payload[key] === "" || payload[key] === undefined) {
          delete payload[key];
        }
      }

      // Remove undefined numeric fields
      if (payload.registration_fee == null) delete payload.registration_fee;
      if (payload.monthly_fee == null) delete payload.monthly_fee;
      if (payload.max_members == null) delete payload.max_members;

      const { data, error } = await supabase
        .from("programs")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Error creating program:", error);
        throw error;
      }

      return this.mapRowToBasicProgram(data);
    } catch (error) {
      console.error("Error in createProgram:", error);
      throw error;
    }
  }

  /** Update an existing program */
  static async updateProgram(
    programId: string,
    updates: UpdateProgramData
  ): Promise<Program> {
    try {
      const payload: Record<string, unknown> = {};
      const allowedKeys = new Set([
        "name",
        "description",
        "program_type",
        "is_active",
        "requires_approval",
        "season_start",
        "season_end",
        "has_fees",
        "registration_fee",
        "monthly_fee",
        "max_members",
        "image_url",
        "visibility",
        "schedule",
      ]);

      for (const [k, v] of Object.entries(updates)) {
        if (allowedKeys.has(k) && v !== undefined) {
          payload[k] = v === "" ? null : v;
        }
      }

      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("programs")
        .update(payload)
        .eq("id", programId)
        .select()
        .single();

      if (error) {
        console.error("Error updating program:", error);
        throw error;
      }

      return this.mapRowToBasicProgram(data);
    } catch (error) {
      console.error("Error in updateProgram:", error);
      throw error;
    }
  }

  /** Delete a program by ID */
  static async deleteProgram(programId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", programId);

      if (error) {
        console.error("Error deleting program:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in deleteProgram:", error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Membership
  // ---------------------------------------------------------------------------

  /** Get all members of a program */
  static async getProgramMembers(
    programId: string
  ): Promise<ProgramMembershipWithMember[]> {
    try {
      const { data, error } = await supabase
        .from("program_memberships")
        .select(
          "*, members(id, first_name, last_name, email, membership_status)"
        )
        .eq("program_id", programId)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Error fetching program members:", error);
        throw error;
      }

      return (data ?? []).map((row) => {
        const members = row.members as unknown as {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          membership_status: string;
        };
        return {
          id: String(row.id),
          program_id: String(row.program_id),
          member_id: String(row.member_id),
          role: row.role ?? "participant",
          status: row.status ?? "active",
          joined_at: row.joined_at ?? row.created_at,
          payment_status: row.payment_status ?? "free",
          last_payment_date: row.last_payment_date ?? null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          member: {
            id: String(members.id),
            first_name: members.first_name ?? "",
            last_name: members.last_name ?? "",
            email: members.email ?? null,
            membership_status: members.membership_status ?? "active",
          },
        } as ProgramMembershipWithMember;
      });
    } catch (error) {
      console.error("Error in getProgramMembers:", error);
      throw error;
    }
  }

  /** Join a program (create membership) */
  static async joinProgram(
    programId: string,
    memberId: string
  ): Promise<ProgramMembership> {
    try {
      const { data, error } = await supabase
        .from("program_memberships")
        .insert({
          program_id: Number(programId),
          member_id: Number(memberId),
          role: "participant",
          status: "active",
          payment_status: "free", // Free for now; Stripe integration later
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error joining program:", error);
        throw error;
      }

      return {
        id: String(data.id),
        program_id: String(data.program_id),
        member_id: String(data.member_id),
        role: data.role ?? "participant",
        status: data.status ?? "active",
        joined_at: data.joined_at ?? data.created_at,
        payment_status: data.payment_status ?? "free",
        last_payment_date: data.last_payment_date ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error("Error in joinProgram:", error);
      throw error;
    }
  }

  /** Leave a program (delete membership) */
  static async leaveProgram(
    programId: string,
    memberId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("program_memberships")
        .delete()
        .eq("program_id", programId)
        .eq("member_id", memberId);

      if (error) {
        console.error("Error leaving program:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in leaveProgram:", error);
      throw error;
    }
  }

  /** Check if a member is part of a program */
  static async getMembershipStatus(
    programId: string,
    memberId: string
  ): Promise<ProgramMembership | null> {
    try {
      const { data, error } = await supabase
        .from("program_memberships")
        .select("*")
        .eq("program_id", programId)
        .eq("member_id", memberId)
        .maybeSingle();

      if (error) {
        console.error("Error checking membership:", error);
        throw error;
      }

      if (!data) return null;

      return {
        id: String(data.id),
        program_id: String(data.program_id),
        member_id: String(data.member_id),
        role: data.role ?? "participant",
        status: data.status ?? "active",
        joined_at: data.joined_at ?? data.created_at,
        payment_status: data.payment_status ?? "free",
        last_payment_date: data.last_payment_date ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error("Error in getMembershipStatus:", error);
      throw error;
    }
  }

  /** Get all programs a specific member belongs to */
  static async getMemberPrograms(
    memberId: string
  ): Promise<ProgramWithMemberCount[]> {
    try {
      const { data, error } = await supabase
        .from("program_memberships")
        .select("program_id, programs(*, program_memberships(count))")
        .eq("member_id", memberId)
        .eq("status", "active");

      if (error) {
        console.error("Error fetching member programs:", error);
        throw error;
      }

      return (data ?? [])
        .map((row) => {
          const program = row.programs as unknown as Record<string, unknown>;
          if (!program) return null;
          return this.mapRowToProgram(program);
        })
        .filter(Boolean) as ProgramWithMemberCount[];
    } catch (error) {
      console.error("Error in getMemberPrograms:", error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private static mapRowToProgram(
    row: Record<string, unknown>
  ): ProgramWithMemberCount {
    const memberships = row.program_memberships as
      | Array<{ count: number }>
      | undefined;
    const memberCount = memberships?.[0]?.count ?? 0;

    return {
      ...this.mapRowToBasicProgram(row),
      member_count: memberCount,
    };
  }

  private static mapRowToBasicProgram(
    row: Record<string, unknown>
  ): Program {
    return {
      id: String(row.id ?? ""),
      club_id: String(row.club_id ?? ""),
      name: (row.name as string) ?? "",
      description: (row.description as string | null) ?? null,
      program_type: (row.program_type as string) ?? "general",
      is_active: (row.is_active as boolean) ?? true,
      requires_approval: (row.requires_approval as boolean) ?? false,
      season_start: (row.season_start as string | null) ?? null,
      season_end: (row.season_end as string | null) ?? null,
      has_fees: (row.has_fees as boolean) ?? false,
      registration_fee: (row.registration_fee as number | null) ?? null,
      monthly_fee: (row.monthly_fee as number | null) ?? null,
      max_members: (row.max_members as number | null) ?? null,
      image_url: (row.image_url as string | null) ?? null,
      visibility: (row.visibility as Program["visibility"]) ?? "public",
      schedule: (row.schedule as ProgramScheduleEntry[]) ?? [],
      settings: (row.settings as Record<string, unknown>) ?? {},
      created_at: (row.created_at as string) ?? new Date().toISOString(),
      updated_at: (row.updated_at as string) ?? new Date().toISOString(),
    };
  }
}
