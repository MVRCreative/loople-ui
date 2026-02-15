import { supabase } from "../supabase";
import { MembersService } from "./members.service";

export interface WaitlistApplication {
  id: string;
  club_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  application_data?: Record<string, unknown>;
  payment_intent_id?: string;
  payment_amount: number;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  position: number;
  status: "pending" | "approved" | "rejected" | "removed";
  approved_at?: string;
  approved_by?: string;
  converted_member_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWaitlistApplicationData {
  club_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  application_data?: Record<string, unknown>;
  payment_intent_id?: string;
  payment_amount?: number;
  payment_status?: WaitlistApplication["payment_status"];
  position?: number;
}

export interface ClubWaitlistSettings {
  waitlist_enabled: boolean;
  waitlist_payment_amount: number | null;
}

export class WaitlistService {
  static async getWaitlistByClubId(clubId: string): Promise<WaitlistApplication[]> {
    const { data, error } = await supabase
      .from("waitlist_applications")
      .select("*")
      .eq("club_id", clubId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      // PGRST116 = no rows found — treat as empty, not an error
      // 42P01 = table doesn't exist — also treat as empty
      const code = (error as { code?: string }).code;
      if (code === "PGRST116" || code === "42P01") {
        return [];
      }
      console.error("Error fetching waitlist:", error);
      // Return empty but log the actual error so it's visible
      return [];
    }
    return (data ?? []).map(normalizeWaitlistRow);
  }

  static async getClubWaitlistSettings(clubId: string): Promise<ClubWaitlistSettings | null> {
    const { data, error } = await supabase
      .from("clubs")
      .select("waitlist_enabled, waitlist_payment_amount")
      .eq("id", clubId)
      .single();

    if (error) return null;
    return {
      waitlist_enabled: Boolean(data?.waitlist_enabled ?? false),
      waitlist_payment_amount: data?.waitlist_payment_amount ?? null,
    };
  }

  static async updateClubWaitlistSettings(
    clubId: string,
    settings: Partial<ClubWaitlistSettings>
  ): Promise<void> {
    const body: Record<string, unknown> = { club_id: clubId };
    if (settings.waitlist_enabled !== undefined) body.waitlist_enabled = settings.waitlist_enabled;
    if (settings.waitlist_payment_amount !== undefined)
      body.waitlist_payment_amount = settings.waitlist_payment_amount;

    const { data, error } = await supabase.functions.invoke("update-club-waitlist-settings", {
      method: "POST",
      body,
    });

    if (error) {
      const cause = (error as { context?: { cause?: Error } })?.context?.cause;
      const causeMsg = cause instanceof Error ? cause.message : String(cause ?? "");
      if (error.message?.includes("Failed to send a request")) {
        throw new Error(
          causeMsg
            ? `Cannot reach waitlist service: ${causeMsg}. Ensure NEXT_PUBLIC_SUPABASE_URL points to your hosted project.`
            : "Cannot reach waitlist service. Check your connection and ensure NEXT_PUBLIC_SUPABASE_URL points to your hosted Supabase project."
        );
      }
      throw error;
    }
    if (data && typeof data === "object" && "success" in data && !data.success) {
      throw new Error((data as { error?: string }).error ?? "Failed to update waitlist settings");
    }
  }

  static async createApplication(data: CreateWaitlistApplicationData): Promise<WaitlistApplication> {
    const position = data.position ?? (await this.getNextPosition(data.club_id));

    const row = {
      club_id: Number(data.club_id),
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone ?? null,
      application_data: data.application_data ?? {},
      payment_intent_id: data.payment_intent_id ?? null,
      payment_amount: data.payment_amount ?? 0,
      payment_status: data.payment_status ?? "pending",
      position,
      status: "pending",
    };

    const { data: inserted, error } = await supabase
      .from("waitlist_applications")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return normalizeWaitlistRow(inserted);
  }

  static async updateStatus(
    id: string,
    status: WaitlistApplication["status"]
  ): Promise<WaitlistApplication> {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "approved") {
      updates.approved_at = new Date().toISOString();
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user?.id) updates.approved_by = session.session.user.id;
    }

    const { data, error } = await supabase
      .from("waitlist_applications")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return normalizeWaitlistRow(data);
  }

  static async remove(id: string): Promise<void> {
    const { error } = await supabase.from("waitlist_applications").delete().eq("id", id);
    if (error) throw error;
  }

  static async reorder(clubId: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, i) => ({ id, position: i }));
    for (const { id, position } of updates) {
      const { error } = await supabase
        .from("waitlist_applications")
        .update({ position, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("club_id", clubId);
      if (error) throw error;
    }
  }

  static async convertToMember(applicationId: string): Promise<{ memberId: string }> {
    const { data: app, error: fetchError } = await supabase
      .from("waitlist_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (fetchError || !app) throw new Error("Waitlist application not found");
    if (app.converted_member_id) throw new Error("Already converted to member");

    const [members] = await MembersService.createMember({
      club_id: String(app.club_id),
      first_name: app.first_name,
      last_name: app.last_name,
      email: app.email,
      phone: app.phone ?? undefined,
      member_type: "adult",
      membership_start_date: new Date().toISOString().slice(0, 10),
    });

    if (!members) throw new Error("Failed to create member");

    const { error: updateError } = await supabase
      .from("waitlist_applications")
      .update({
        status: "approved",
        converted_member_id: members.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) throw updateError;

    return { memberId: String(members.id) };
  }

  private static async getNextPosition(clubId: string): Promise<number> {
    const { data } = await supabase
      .from("waitlist_applications")
      .select("position")
      .eq("club_id", clubId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data?.position ?? -1) + 1;
  }
}

function normalizeWaitlistRow(row: Record<string, unknown>): WaitlistApplication {
  return {
    id: String(row.id),
    club_id: String(row.club_id),
    email: String(row.email),
    first_name: String(row.first_name),
    last_name: String(row.last_name),
    phone: row.phone != null ? String(row.phone) : undefined,
    application_data: (row.application_data as Record<string, unknown>) ?? undefined,
    payment_intent_id: row.payment_intent_id != null ? String(row.payment_intent_id) : undefined,
    payment_amount: Number(row.payment_amount ?? 0),
    payment_status: (row.payment_status as WaitlistApplication["payment_status"]) ?? "pending",
    position: Number(row.position ?? 0),
    status: (row.status as WaitlistApplication["status"]) ?? "pending",
    approved_at: row.approved_at != null ? String(row.approved_at) : undefined,
    approved_by: row.approved_by != null ? String(row.approved_by) : undefined,
    converted_member_id: row.converted_member_id != null ? String(row.converted_member_id) : undefined,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
