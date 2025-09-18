import { supabase, getFunctionsUrl } from '../supabase';

export interface EventRegistration {
  id: number;
  event_id: number;
  member_id: number;
  registration_date: string;
  status: 'registered' | 'confirmed' | 'canceled' | 'waitlisted' | 'attended';
  payment_required: boolean;
  payment_amount?: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_id?: number;
  registration_data: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  members: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    user_id: string;
  };
}

export interface RSVPStatus {
  status: 'registered' | 'confirmed' | 'canceled' | 'waitlisted' | 'attended';
}

export class RSVPService {
  /**
   * Get RSVPs for an event
   */
  static async getEventRSVPs(eventId: string): Promise<EventRegistration[]> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const url = `${getFunctionsUrl()}/events/${eventId}/rsvp`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to fetch RSVPs: ${response.status}`);
      }

      const json = await response.json().catch(() => null);
      
      // Handle the wrapped response from Edge Function
      if (json && json.success && json.data) {
        return json.data as EventRegistration[];
      }
      
      return [];
    } catch (error) {
      console.error('Error in getEventRSVPs:', error);
      throw error;
    }
  }

  /**
   * Update RSVP status for an event
   */
  static async updateRSVP(eventId: string, status: RSVPStatus['status']): Promise<EventRegistration> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const url = `${getFunctionsUrl()}/events/${eventId}/rsvp`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to update RSVP: ${response.status}`);
      }

      const json = await response.json().catch(() => null);
      
      // Handle the wrapped response from Edge Function
      if (json && json.success && json.data) {
        return json.data as EventRegistration;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error in updateRSVP:', error);
      throw error;
    }
  }
}
