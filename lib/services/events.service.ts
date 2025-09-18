import { supabase, getFunctionsUrl } from '../supabase';

export interface Event {
  id: number;
  club_id: number;
  program_id?: number;
  title: string;
  description?: string;
  event_type: 'meeting' | 'competition' | 'practice' | 'social' | 'other';
  start_date: string;
  end_date: string;
  location?: string; // Backend returns location as string, not object
  max_capacity?: number;
  registration_deadline?: string;
  price_member?: number;
  price_non_member?: number;
  is_active: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Computed fields from backend
  is_upcoming: boolean;
  is_past: boolean;
  capacity: {
    max?: number;
    current: number;
    waitlist: boolean;
  };
  rsvp_count: {
    going: number;
    maybe: number;
    not_going: number;
    not_responded: number;
    total: number;
  };
  program?: {
    id: string;
    name: string;
    description?: string;
  };
  programs?: {
    name: string;
    program_type: string;
  };
  clubs?: {
    name: string;
    subdomain: string;
  };
  event_registrations?: Array<{
    id: string;
    status: string;
    registration_date: string;
  }>;
  image_url?: string;
}

export interface CreateEventData {
  club_id: number | string;
  title: string;
  description?: string;
  event_type: 'meeting' | 'competition' | 'practice' | 'social' | 'other';
  start_date: string;
  end_date: string;
  location?: string;
  max_capacity?: number;
  registration_deadline?: string;
  price_member?: number;
  price_non_member?: number;
  program_id?: number;
}

export interface EventFilters {
  club_id?: number | string;
  program_id?: number;
  event_type?: string;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export class EventsService {
  /**
   * Get all events with optional filters
   */
  static async getEvents(filters: EventFilters = {}): Promise<Event[]> {
    try {
      // Use edge function via GET to match Postman collection usage
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams();
      if (filters.club_id) params.set('club_id', String(filters.club_id));
      if (filters.program_id) params.set('program_id', String(filters.program_id));
      if (filters.event_type) params.set('event_type', String(filters.event_type));
      if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active));
      if (filters.start_date) params.set('start_date', String(filters.start_date));
      if (filters.end_date) params.set('end_date', String(filters.end_date));
      if (filters.search) params.set('search', String(filters.search));
      if (filters.page != null) params.set('page', String(filters.page));
      if (filters.limit != null) params.set('limit', String(filters.limit));
      if (filters.sort_by) params.set('sort_by', String(filters.sort_by));
      if (filters.sort_order) params.set('sort_order', String(filters.sort_order));

      const url = `${getFunctionsUrl()}/events${params.toString() ? `?${params.toString()}` : ''}`;
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
        throw new Error(errorText || `Failed to fetch events: ${response.status}`);
      }

      const json = await response.json().catch(() => ([]));
      
      if (Array.isArray(json)) {
        return json as Event[];
      }
      if (json && Array.isArray(json.data)) {
        return json.data as Event[];
      }
      return [];
    } catch (error) {
      console.error('Error in getEvents:', error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(eventData: CreateEventData): Promise<Event[]> {
    try {
      const { data, error } = await supabase.functions.invoke('events', {
        method: 'POST',
        body: eventData
      });
      
      if (error) {
        console.error('Error creating event:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw error;
    }
  }

  /**
   * Update an event
   */
  static async updateEvent(eventId: string, updates: Partial<CreateEventData>): Promise<Event[]> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const url = `${getFunctionsUrl()}/events/${eventId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to update event: ${response.status}`);
      }

      const json = await response.json().catch(() => ([]));
      if (Array.isArray(json)) return json as Event[];
      if (json && Array.isArray(json.data)) return json.data as Event[];
      return [];
    } catch (error) {
      console.error('Error in updateEvent:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const url = `${getFunctionsUrl()}/events/${eventId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to delete event: ${response.status}`);
      }
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  static async getEventById(eventId: string): Promise<Event | null> {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const url = `${getFunctionsUrl()}/events/${eventId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Event not found
        }
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to fetch event: ${response.status}`);
      }

      const json = await response.json().catch(() => null);
      
      console.log('EventsService.getEventById response:', json);
      
      // Handle the wrapped response from Edge Function
      if (json && json.success && json.data) {
        return json.data as Event;
      }
      
      // Handle direct response (fallback)
      if (Array.isArray(json)) {
        return json[0] as Event || null;
      }
      if (json && !Array.isArray(json)) {
        return json as Event;
      }
      return null;
    } catch (error) {
      console.error('Error in getEventById:', error);
      throw error;
    }
  }
}
