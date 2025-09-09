import { supabase } from '../supabase';

export interface Registration {
  id: string;
  club_id: string;
  event_id: string;
  member_id: string;
  registration_date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  member?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  event?: {
    title: string;
    start_date: string;
  };
}

export interface CreateRegistrationData {
  club_id: string;
  event_id: string;
  member_id: string;
  notes?: string;
}

export class RegistrationsService {
  /**
   * Get all registrations with optional filters
   */
  static async getRegistrations(filters: { club_id?: string; event_id?: string; member_id?: string } = {}): Promise<Registration[]> {
    try {
      let query = supabase
        .from('registrations')
        .select(`
          *,
          member:members(first_name, last_name, email),
          event:events(title, start_date)
        `)
        .order('registration_date', { ascending: false });

      if (filters.club_id) {
        query = query.eq('club_id', filters.club_id);
      }
      if (filters.event_id) {
        query = query.eq('event_id', filters.event_id);
      }
      if (filters.member_id) {
        query = query.eq('member_id', filters.member_id);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching registrations:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getRegistrations:', error);
      throw error;
    }
  }

  /**
   * Create a new registration
   */
  static async createRegistration(registrationData: CreateRegistrationData): Promise<Registration[]> {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert(registrationData)
        .select();
      
      if (error) {
        console.error('Error creating registration:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in createRegistration:', error);
      throw error;
    }
  }

  /**
   * Update a registration
   */
  static async updateRegistration(registrationId: string, updates: Partial<CreateRegistrationData & { status?: string }>): Promise<Registration[]> {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .update(updates)
        .eq('id', registrationId)
        .select();
      
      if (error) {
        console.error('Error updating registration:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in updateRegistration:', error);
      throw error;
    }
  }

  /**
   * Delete a registration
   */
  static async deleteRegistration(registrationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId);
      
      if (error) {
        console.error('Error deleting registration:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteRegistration:', error);
      throw error;
    }
  }

  /**
   * Get registration by ID
   */
  static async getRegistrationById(registrationId: string): Promise<Registration | null> {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          member:members(first_name, last_name, email),
          event:events(title, start_date)
        `)
        .eq('id', registrationId)
        .single();
      
      if (error) {
        console.error('Error fetching registration:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getRegistrationById:', error);
      throw error;
    }
  }
}
