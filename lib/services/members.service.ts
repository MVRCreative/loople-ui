import { supabase, getFunctionsUrl } from '../supabase';

export interface Member {
  id: string;
  club_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  member_type: 'adult' | 'child' | 'family';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_start_date: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'canceled';
  role?: string;
  admin_notes?: string;
  parent_member_id?: string;
  household_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberData {
  club_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  member_type: 'adult' | 'child' | 'family';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_start_date: string;
  parent_member_id?: string;
  household_id?: string;
}

export class MembersService {
  /**
   * Get all members for a club
   */
  static async getClubMembers(clubId?: string): Promise<Member[]> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const url = `${getFunctionsUrl()}/members${clubId ? `?clubId=${encodeURIComponent(clubId)}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to fetch members: ${response.status}`);
      }

      const json = await response.json().catch(() => ([]));
      // Case 1: API directly returns an array of members
      if (Array.isArray(json)) return json;
      // Case 2: API returns { data: Member[] }
      if (json && Array.isArray(json.data)) return json.data;
      // Case 3: API returns { success, data: { ..., members: [] } }
      if (json && json.data && Array.isArray(json.data.members)) {
        const clubIdFromPayload = json.data.id != null ? String(json.data.id) : (clubId ?? "");
        type ApiMember = Partial<Record<keyof Member |
          'membership_status' | 'created_at' | 'updated_at', unknown>> & { id?: unknown };
        const mapped: Member[] = (json.data.members as unknown[]).map((m) => {
          const am = m as ApiMember;
          return {
            id: String(am.id ?? ''),
            club_id: clubIdFromPayload,
            user_id: (am.user_id as string | undefined) ?? undefined,
            first_name: (am.first_name as string) ?? "",
            last_name: (am.last_name as string) ?? "",
            email: (am.email as string) ?? "",
            phone: (am.phone as string | undefined) ?? undefined,
            date_of_birth: (am.date_of_birth as string | undefined) ?? undefined,
            member_type: (am.member_type as Member['member_type']) ?? 'adult',
            emergency_contact_name: (am.emergency_contact_name as string | undefined) ?? undefined,
            emergency_contact_phone: (am.emergency_contact_phone as string | undefined) ?? undefined,
            membership_start_date: ((am.membership_start_date as string | undefined) || (am.created_at as string | undefined) || new Date().toISOString()),
            status: ((am as unknown as { membership_status?: Member['status']; status?: Member['status'] }).membership_status || (am as unknown as { status?: Member['status'] }).status || 'active'),
            role: (am.role as string | undefined) ?? undefined,
            admin_notes: (am.admin_notes as string | undefined) ?? undefined,
            parent_member_id: am.parent_member_id != null ? String(am.parent_member_id) : undefined,
            household_id: am.household_id != null ? String(am.household_id) : undefined,
            created_at: (am.created_at as string | undefined) || new Date().toISOString(),
            updated_at: (am.updated_at as string | undefined) || (am.created_at as string | undefined) || new Date().toISOString(),
          };
        });
        return mapped;
      }
      return [];
    } catch (error) {
      console.error('Error in getClubMembers:', error);
      throw error;
    }
  }

  /**
   * Create a new member
   */
  static async createMember(memberData: CreateMemberData): Promise<Member[]> {
    try {
      // Align with Postman: ensure numeric club_id when applicable and drop empty optional fields
      const sanitized: Record<string, unknown> = { ...memberData };
      // Coerce club_id to number if it looks numeric
      if (sanitized.club_id != null && /^\d+$/.test(String(sanitized.club_id))) {
        sanitized.club_id = Number(sanitized.club_id);
      }
      // Remove empty-string optional fields to avoid type errors in PostgREST
      const optionalKeys = [
        'phone',
        'date_of_birth',
        'emergency_contact_name',
        'emergency_contact_phone',
      ];
      for (const key of optionalKeys) {
        if (sanitized[key] === '') delete sanitized[key];
      }

      // Normalize legacy/demo values to match enum { adult, child, family }
      if (sanitized.member_type === 'individual') sanitized.member_type = 'adult';
      if (sanitized.member_type === 'youth') sanitized.member_type = 'child';

      if (sanitized.parent_member_id != null && sanitized.parent_member_id !== '') {
        sanitized.parent_member_id = /^\d+$/.test(String(sanitized.parent_member_id)) ? Number(sanitized.parent_member_id) : sanitized.parent_member_id;
      } else {
        delete sanitized.parent_member_id;
      }
      if (sanitized.household_id != null && sanitized.household_id !== '') {
        sanitized.household_id = /^\d+$/.test(String(sanitized.household_id)) ? Number(sanitized.household_id) : sanitized.household_id;
      } else {
        delete sanitized.household_id;
      }

      const { data, error } = await supabase
        .from('members')
        .insert(sanitized)
        .select();
      
      if (error) {
        console.error('Error creating member:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in createMember:', error);
      throw error;
    }
  }

  /**
   * Update a member
   */
  static async updateMember(
    memberId: string,
    updates: Partial<CreateMemberData> & { status?: Member['status']; membership_status?: Member['status']; admin_notes?: string; parent_member_id?: string | null; household_id?: string | null }
  ): Promise<Member[]> {
    try {
      // Whitelist columns per schema
      const allowedKeys = new Set([
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'member_type',
        'emergency_contact_name',
        'emergency_contact_phone',
        'membership_start_date',
        'membership_status',
        'admin_notes',
        'parent_member_id',
        'household_id',
      ]);
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (k === 'status') {
          if (v !== '') payload['membership_status'] = v as Member['status'];
          continue;
        }
        if (k === 'parent_member_id' || k === 'household_id') {
          payload[k] = v === '' || v === undefined ? null : (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v);
          continue;
        }
        if (allowedKeys.has(k)) {
          if (v !== undefined && v !== null) payload[k] = v as unknown;
        }
      }

      const { data, error } = await supabase
        .from('members')
        .update(payload)
        .eq('id', memberId)
        .select();
      
      if (error) {
        console.error('Error updating member:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in updateMember:', error);
      throw error;
    }
  }

  /**
   * Delete a member
   */
  static async deleteMember(memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);
      
      if (error) {
        console.error('Error deleting member:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteMember:', error);
      throw error;
    }
  }

  /**
   * Get member by ID
   * Normalizes membership_status vs status so UI gets consistent status field.
   */
  static async getMemberById(memberId: string): Promise<Member | null> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) {
        if ((error as { code?: string }).code === "PGRST116") return null;
        console.error("Error fetching member:", error);
        throw error;
      }

      if (!data) return null;

      type ApiMember = Partial<Record<keyof Member | 'membership_status', unknown>>;
      const am = data as ApiMember;
      return {
        id: String(am.id ?? ''),
        club_id: String(am.club_id ?? ''),
        user_id: (am.user_id as string | undefined) ?? undefined,
        first_name: (am.first_name as string) ?? '',
        last_name: (am.last_name as string) ?? '',
        email: (am.email as string) ?? '',
        phone: (am.phone as string | undefined) ?? undefined,
        date_of_birth: (am.date_of_birth as string | undefined) ?? undefined,
        member_type: (am.member_type as Member['member_type']) ?? 'adult',
        emergency_contact_name: (am.emergency_contact_name as string | undefined) ?? undefined,
        emergency_contact_phone: (am.emergency_contact_phone as string | undefined) ?? undefined,
        membership_start_date:
          (am.membership_start_date as string | undefined) ??
          (am.created_at as string | undefined) ??
          new Date().toISOString(),
        status:
          ((am as unknown as { membership_status?: Member['status']; status?: Member['status'] }).membership_status ??
            (am as unknown as { status?: Member['status'] }).status) ??
          'active',
        role: (am.role as string | undefined) ?? undefined,
        admin_notes: (am.admin_notes as string | undefined) ?? undefined,
        parent_member_id: am.parent_member_id != null ? String(am.parent_member_id) : undefined,
        household_id: am.household_id != null ? String(am.household_id) : undefined,
        created_at: (am.created_at as string | undefined) ?? new Date().toISOString(),
        updated_at:
          (am.updated_at as string | undefined) ??
          (am.created_at as string | undefined) ??
          new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getMemberById:', error);
      throw error;
    }
  }

  /**
   * Get children of a parent member (members where parent_member_id = parentMemberId)
   */
  static async getChildren(parentMemberId: string): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('parent_member_id', parentMemberId);

      if (error) {
        console.error('Error fetching children:', error);
        throw error;
      }

      return (data ?? []).map((row) => this.mapApiRowToMember(row));
    } catch (error) {
      console.error('Error in getChildren:', error);
      throw error;
    }
  }

  /**
   * Get all members in a household (members with same household_id)
   */
  static async getHouseholdMembers(householdId: string): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('household_id', householdId);

      if (error) {
        console.error('Error fetching household members:', error);
        throw error;
      }

      return (data ?? []).map((row) => this.mapApiRowToMember(row));
    } catch (error) {
      console.error('Error in getHouseholdMembers:', error);
      throw error;
    }
  }

  /**
   * Get family members for a member (household + children)
   * If member has household_id, returns household members. If member has parent, returns parent + siblings.
   */
  static async getFamilyForMember(member: Member): Promise<Member[]> {
    const family: Member[] = [];

    if (member.household_id) {
      const household = await this.getHouseholdMembers(member.household_id);
      family.push(...household.filter((m) => m.id !== member.id));
    }

    // If this member is a parent, include their children
    const children = await this.getChildren(member.id);
    family.push(...children.filter((c) => !family.some((f) => f.id === c.id)));

    // If this member has a parent, include parent and siblings
    if (member.parent_member_id) {
      const parent = await this.getMemberById(member.parent_member_id);
      if (parent && !family.some((f) => f.id === parent.id)) {
        family.push(parent);
      }
      const siblings = await this.getChildren(member.parent_member_id);
      siblings.forEach((s) => {
        if (s.id !== member.id && !family.some((f) => f.id === s.id)) {
          family.push(s);
        }
      });
    }

    return family;
  }

  private static mapApiRowToMember(row: Record<string, unknown>): Member {
    const am = row as Partial<Record<keyof Member | 'membership_status', unknown>>;
    return {
      id: String(am.id ?? ''),
      club_id: String(am.club_id ?? ''),
      user_id: (am.user_id as string | undefined) ?? undefined,
      first_name: (am.first_name as string) ?? '',
      last_name: (am.last_name as string) ?? '',
      email: (am.email as string) ?? '',
      phone: (am.phone as string | undefined) ?? undefined,
      date_of_birth: (am.date_of_birth as string | undefined) ?? undefined,
      member_type: (am.member_type as Member['member_type']) ?? 'adult',
      emergency_contact_name: (am.emergency_contact_name as string | undefined) ?? undefined,
      emergency_contact_phone: (am.emergency_contact_phone as string | undefined) ?? undefined,
      membership_start_date:
        (am.membership_start_date as string | undefined) ??
        (am.created_at as string | undefined) ??
        new Date().toISOString(),
      status:
        ((am as unknown as { membership_status?: Member['status']; status?: Member['status'] }).membership_status ??
          (am as unknown as { status?: Member['status'] }).status) ??
        'active',
      role: (am.role as string | undefined) ?? undefined,
      admin_notes: (am.admin_notes as string | undefined) ?? undefined,
      parent_member_id: am.parent_member_id != null ? String(am.parent_member_id) : undefined,
      household_id: am.household_id != null ? String(am.household_id) : undefined,
      created_at: (am.created_at as string | undefined) ?? new Date().toISOString(),
      updated_at:
        (am.updated_at as string | undefined) ??
        (am.created_at as string | undefined) ??
        new Date().toISOString(),
    };
  }
}
