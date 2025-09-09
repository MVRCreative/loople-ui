import { supabase } from '../supabase';

export interface Member {
  id: string;
  club_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  member_type: 'individual' | 'family' | 'adult' | 'youth';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_start_date: string;
  membership_end_date?: string;
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
  member_type: 'individual' | 'family' | 'adult' | 'youth';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_start_date: string;
  membership_end_date?: string;
}

export class MembersService {
  /**
   * Get all members for a club
   */
  static async getClubMembers(clubId?: string): Promise<Member[]> {
    try {
      const { data, error } = await supabase.functions.invoke('members', {
        method: 'GET',
        query: clubId ? { clubId } : {}
      });
      
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      return data || [];
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
      const { data, error } = await supabase
        .from('members')
        .insert(memberData)
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
  static async updateMember(memberId: string, updates: Partial<CreateMemberData>): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
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
