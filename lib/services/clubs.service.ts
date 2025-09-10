import { supabase } from '../supabase';

export interface Club {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  owner_id: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClubData {
  name: string;
  subdomain: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface JoinClubData {
  club_id: string;
}

export interface InviteToClubData {
  club_id: string;
  email: string;
  first_name: string;
  last_name: string;
  member_type: string;
}

export interface ConfirmInviteData {
  token: string;
}

export class ClubsService {
  /**
   * Get all clubs where the user is a member or owner
   */
  static async getUserClubs(): Promise<Club[]> {
    try {
      const { data, error } = await supabase.functions.invoke('clubs', {
        method: 'GET'
      });
      
      
      
      if (error) {
        console.error('Error fetching user clubs:', error);
        throw error;
      }

      // The edge function may return either an array directly or an object { success, data }
      let clubsRaw: any[] = [];
      if (Array.isArray(data)) {
        clubsRaw = data;
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
        clubsRaw = (data as any).data;
      } else {
        clubsRaw = [];
      }

      // Normalize to our Club shape and ensure string ids
      const normalizedClubs: Club[] = clubsRaw.map((club: any) => ({
        id: String(club.id),
        name: club.name ?? '',
        subdomain: club.subdomain ?? '',
        description: club.description ?? undefined,
        contact_email: club.contact_email ?? undefined,
        contact_phone: club.contact_phone ?? undefined,
        address: club.address ?? undefined,
        city: club.city ?? undefined,
        state: club.state ?? undefined,
        zip_code: club.zip_code ?? undefined,
        owner_id: String(club.owner_id),
        onboarding_completed: Boolean(club.onboarding_completed ?? false),
        created_at: club.created_at ?? '',
        updated_at: club.updated_at ?? ''
      }));

      return normalizedClubs;
    } catch (error) {
      console.error('Error in getUserClubs:', error);
      throw error;
    }
  }

  /**
   * Create a new club
   */
  static async createClub(clubData: CreateClubData): Promise<Club[]> {
    try {
      const { data, error } = await supabase.functions.invoke('clubs', {
        method: 'POST',
        body: clubData
      });
      
      
      
      // Check if the response indicates an error (even with 200 status)
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        console.error('API returned error response:', data);
        // Show the exact error message from the API
        const errorMessage = data.error || 'Unknown error occurred';
        throw new Error(errorMessage);
      }
      
      if (error) {
        console.error('Error creating club:', error);
        // Handle different types of errors
        if (error.message) {
          throw new Error(error.message);
        } else if (typeof error === 'string') {
          throw new Error(error);
        } else {
          throw new Error('Failed to create club. Please try again.');
        }
      }
      
      return data || [];
    } catch (error: any) {
      console.error('Error in createClub:', error);
      
      // If it's already a properly formatted error, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      
      // Handle Supabase function errors
      if (error?.error) {
        const errorMessage = error.error.error || error.error.message || 'Unknown error occurred';
        throw new Error(errorMessage);
      }
      
      // Fallback error
      throw new Error('Failed to create club. Please try again.');
    }
  }

  /**
   * Join a club
   */
  static async joinClub(joinData: JoinClubData): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('clubs-join', {
        method: 'POST',
        body: joinData
      });
      
      if (error) {
        console.error('Error joining club:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in joinClub:', error);
      throw error;
    }
  }

  /**
   * Invite someone to join a club
   */
  static async inviteToClub(inviteData: InviteToClubData): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('clubs-invite', {
        method: 'POST',
        body: inviteData
      });
      
      if (error) {
        console.error('Error inviting to club:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in inviteToClub:', error);
      throw error;
    }
  }

  /**
   * Confirm invitation to join club
   */
  static async confirmInvite(confirmData: ConfirmInviteData): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('clubs-confirm-invite', {
        method: 'POST',
        body: confirmData
      });
      
      if (error) {
        console.error('Error confirming invite:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in confirmInvite:', error);
      throw error;
    }
  }

  /**
   * Update club onboarding status
   */
  static async updateOnboardingStatus(clubId: string, completed: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ onboarding_completed: completed })
        .eq('id', clubId);
      
      if (error) {
        console.error('Error updating onboarding status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateOnboardingStatus:', error);
      throw error;
    }
  }

  /**
   * Get club details by ID
   */
  static async getClubById(clubId: string): Promise<Club | null> {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
      
      if (error) {
        console.error('Error fetching club:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getClubById:', error);
      throw error;
    }
  }
}
