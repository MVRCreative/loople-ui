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
  status: 'active' | 'inactive' | 'pending';
  role?: string;
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
        const mapped: Member[] = json.data.members.map((m: any) => ({
          id: String(m.id),
          club_id: clubIdFromPayload,
          user_id: m.user_id ?? undefined,
          first_name: m.first_name ?? "",
          last_name: m.last_name ?? "",
          email: m.email ?? "",
          phone: m.phone ?? undefined,
          date_of_birth: m.date_of_birth ?? undefined,
          member_type: m.member_type ?? 'adult',
          emergency_contact_name: m.emergency_contact_name ?? undefined,
          emergency_contact_phone: m.emergency_contact_phone ?? undefined,
          membership_start_date: (m.membership_start_date || m.created_at || new Date().toISOString()),
          status: (m.membership_status || m.status || 'active'),
          role: m.role ?? undefined,
          created_at: m.created_at || new Date().toISOString(),
          updated_at: m.updated_at || m.created_at || new Date().toISOString(),
        }));
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
      const sanitized: any = { ...memberData };
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
    updates: Partial<CreateMemberData> & { status?: 'active' | 'inactive' | 'pending', membership_status?: 'active' | 'inactive' | 'pending' }
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
      ]);
      const payload: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (k === 'status') {
          // Map UI field to DB column name
          if (v !== '') payload['membership_status'] = v;
          continue;
        }
        if (allowedKeys.has(k)) {
          if (v !== '') payload[k] = v;
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
   */
  static async getMemberById(memberId: string): Promise<Member | null> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();
      
      if (error) {
        console.error('Error fetching member:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getMemberById:', error);
      throw error;
    }
  }
}
