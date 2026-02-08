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

type ClubLike = {
  id?: unknown;
  name?: unknown;
  subdomain?: unknown;
  description?: unknown;
  contact_email?: unknown;
  contact_phone?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  zip_code?: unknown;
  owner_id?: unknown;
  onboarding_completed?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

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
      let clubsRaw: unknown[] = [];
      if (Array.isArray(data)) {
        clubsRaw = data as unknown[];
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data)) {
        clubsRaw = (data as { data: unknown[] }).data;
      } else {
        clubsRaw = [];
      }

      // Normalize to our Club shape and ensure string ids
      const normalizedClubs: Club[] = clubsRaw.map((club: unknown) => {
        const c = club as ClubLike;
        return {
          id: String(c.id ?? ''),
          name: (c.name as string) ?? '',
          subdomain: (c.subdomain as string) ?? '',
          description: (c.description as string | undefined) ?? undefined,
          contact_email: (c.contact_email as string | undefined) ?? undefined,
          contact_phone: (c.contact_phone as string | undefined) ?? undefined,
          address: (c.address as string | undefined) ?? undefined,
          city: (c.city as string | undefined) ?? undefined,
          state: (c.state as string | undefined) ?? undefined,
          zip_code: (c.zip_code as string | undefined) ?? undefined,
          owner_id: String(c.owner_id ?? ''),
          onboarding_completed: Boolean((c.onboarding_completed as boolean | undefined) ?? false),
          created_at: (c.created_at as string) ?? '',
          updated_at: (c.updated_at as string) ?? ''
        };
      });

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('You must be signed in to create a club');

      const { data, error } = await supabase.functions.invoke('clubs', {
        method: 'POST',
        body: { ...clubData, owner_id: user.id }
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
    } catch (error: unknown) {
      console.error('Error in createClub:', error);
      
      // If it's already a properly formatted error, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      
      // Handle Supabase function errors
      if (typeof error === 'object' && error !== null && 'error' in error) {
        const errObj = (error as { error: { error?: string; message?: string } }).error;
        const errorMessage = errObj.error || errObj.message || 'Unknown error occurred';
        throw new Error(errorMessage);
      }
      
      // Fallback error
      throw new Error('Failed to create club. Please try again.');
    }
  }

  /**
   * Update club details
   */
  static async updateClub(clubId: string, updates: Partial<CreateClubData>): Promise<Club> {
    try {
      // Prefer Edge Function to enforce owner authorization
      const { data, error } = await supabase.functions.invoke('clubs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { id: clubId, ...updates },
      });

      if (error) {
        console.error('Error updating club:', error);
        throw error;
      }

      // Edge Function returns the updated club directly
      return (Array.isArray(data) ? data[0] : data) as Club;
    } catch (error) {
      console.error('Error in updateClub:', error);
      throw error;
    }
  }

  /**
   * Delete a club by id
   */
  static async deleteClub(clubId: string): Promise<void> {
    try {
      // Prefer secure path: call edge function DELETE when available, else fallback
      // First try Edge Function with path parameter semantics. Cast options to avoid strict method typing.
      const invokeOptions = ({
        method: 'DELETE',
        body: { id: clubId },
        headers: { 'Content-Type': 'application/json' },
      } as unknown) as Parameters<typeof supabase.functions.invoke>[1];
      const { error: fnErr } = await supabase.functions.invoke('clubs', invokeOptions);

      if (fnErr) {
        console.warn('Edge delete failed or not available, falling back to direct delete:', fnErr);
        const idFilter = /^\d+$/.test(String(clubId)) ? Number(clubId) : clubId;
        const { data, error } = await supabase
          .from('clubs')
          .delete()
          .eq('id', idFilter)
          .select();
        if (error) {
          console.error('Error deleting club:', error);
          throw error;
        }
        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error('Delete failed: not found or not authorized');
        }
      }
    } catch (error) {
      console.error('Error in deleteClub:', error);
      throw error;
    }
  }

  /**
   * Join a club
   */
  static async joinClub(joinData: JoinClubData): Promise<unknown> {
    try {
      const { data, error } = await supabase.functions.invoke('clubs-join', {
        method: 'POST',
        body: joinData
      });
      
      if (error) {
        console.error('Error joining club:', error);
        throw error;
      }
      
      return data as unknown;
    } catch (error) {
      console.error('Error in joinClub:', error);
      throw error;
    }
  }

  /**
   * Invite someone to join a club
   */
  static async inviteToClub(inviteData: InviteToClubData): Promise<unknown> {
    try {
      const { data, error } = await supabase.functions.invoke('clubs-invite', {
        method: 'POST',
        body: inviteData
      });
      
      if (error) {
        console.error('Error inviting to club:', error);
        throw error;
      }
      
      return data as unknown;
    } catch (error) {
      console.error('Error in inviteToClub:', error);
      throw error;
    }
  }

  /**
   * Confirm invitation to join club
   */
  static async confirmInvite(confirmData: ConfirmInviteData): Promise<unknown> {
    try {
      const { data, error } = await supabase.functions.invoke('clubs-confirm-invite', {
        method: 'POST',
        body: confirmData
      });
      
      if (error) {
        console.error('Error confirming invite:', error);
        throw error;
      }
      
      return data as unknown;
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
