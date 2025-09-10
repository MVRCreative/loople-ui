import { supabase, getFunctionsUrl } from '../supabase';

export interface Event {
  id: string;
  club_id: string;
  title: string;
  description: string;
  event_type: 'meeting' | 'competition' | 'practice' | 'social';
  start_date: string;
  end_date: string;
  location: string;
  max_capacity?: number;
  registration_deadline?: string;
  price_member?: number;
  price_non_member?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registered_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  club_id: string;
  title: string;
  description: string;
  event_type: 'meeting' | 'competition' | 'practice' | 'social';
  start_date: string;
  end_date: string;
  location: string;
  max_capacity?: number;
  registration_deadline?: string;
  price_member?: number;
  price_non_member?: number;
}

export interface EventFilters {
  club_id?: string;
  event_type?: string;
  start_date?: string;
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
      if (filters.event_type) params.set('event_type', String(filters.event_type));
      if (filters.start_date) params.set('start_date', String(filters.start_date));
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
      if (Array.isArray(json)) return json as Event[];
      if (json && Array.isArray(json.data)) return json.data as Event[];
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
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select();
      
      if (error) {
        console.error('Error updating event:', error);
        throw error;
      }
      
      return data || [];
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
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) {
        console.error('Error deleting event:', error);
        throw error;
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
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) {
        console.error('Error fetching event:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getEventById:', error);
      throw error;
    }
  }
}
