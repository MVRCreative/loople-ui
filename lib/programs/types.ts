/**
 * Program type definitions
 *
 * Purpose: Central type definitions for the Programs feature.
 * Programs are group-like entities within a club that members can discover and join.
 * Think: Facebook groups or paid community groups within a club context.
 */

/** Visibility levels for a program */
export type ProgramVisibility = "public" | "members_only" | "private";

/** Membership role within a program */
export type ProgramMemberRole = "participant" | "admin" | "coach";

/** Membership status within a program */
export type ProgramMemberStatus = "active" | "inactive" | "pending";

/** Payment status for a program membership */
export type ProgramPaymentStatus = "pending" | "paid" | "free" | "failed";

/** A single recurring schedule entry */
export interface ProgramScheduleEntry {
  day_of_week: string;
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
}

/** Core program record (matches DB schema) */
export interface Program {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  program_type: string;
  is_active: boolean;
  requires_approval: boolean;
  season_start: string | null;
  season_end: string | null;
  has_fees: boolean;
  registration_fee: number | null;
  monthly_fee: number | null;
  max_members: number | null;
  image_url: string | null;
  visibility: ProgramVisibility;
  schedule: ProgramScheduleEntry[];
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Program with computed member count for list/card display */
export interface ProgramWithMemberCount extends Program {
  member_count: number;
}

/** Program membership record (matches DB schema) */
export interface ProgramMembership {
  id: string;
  program_id: string;
  member_id: string;
  role: ProgramMemberRole;
  status: ProgramMemberStatus;
  joined_at: string;
  payment_status: ProgramPaymentStatus;
  last_payment_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Program membership with joined member data for display */
export interface ProgramMembershipWithMember extends ProgramMembership {
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    membership_status: string;
  };
}

/** Data required to create a new program */
export interface CreateProgramData {
  club_id: string;
  name: string;
  description?: string;
  program_type: string;
  is_active?: boolean;
  requires_approval?: boolean;
  season_start?: string;
  season_end?: string;
  has_fees?: boolean;
  registration_fee?: number;
  monthly_fee?: number;
  max_members?: number;
  image_url?: string;
  visibility?: ProgramVisibility;
  schedule?: ProgramScheduleEntry[];
}

/** Data for updating an existing program */
export type UpdateProgramData = Partial<CreateProgramData>;

/** Data for joining a program */
export interface JoinProgramData {
  program_id: string;
  member_id: string;
}
