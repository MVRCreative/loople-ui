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
      // Try edge function first
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
        throw new Error(`Edge function returned ${response.status}`);
      }

      const json = await response.json().catch(() => ([]));
      
      if (Array.isArray(json)) {
        return json as Event[];
      }
      if (json && Array.isArray(json.data)) {
        return json.data as Event[];
      }
      return [];
    } catch {
      // Edge function unavailable — fall back to direct Supabase query
      console.warn('Events edge function unavailable, using direct query');
      return this.getEventsDirect(filters);
    }
  }

  /**
   * Direct Supabase query fallback for getEvents
   */
  private static async getEventsDirect(filters: EventFilters = {}): Promise<Event[]> {
    try {
      let query = supabase
        .from('events')
        .select('*, programs(name, program_type)');

      if (filters.club_id) query = query.eq('club_id', filters.club_id);
      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
      if (filters.search) query = query.ilike('title', `%${filters.search}%`);

      const sortBy = filters.sort_by || 'start_date';
      const sortOrder = filters.sort_order === 'desc' ? false : true;
      query = query.order(sortBy, { ascending: sortOrder });

      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) {
        console.error('Direct events query failed:', error);
        throw error;
      }

      // Transform DB rows to match Event interface
      return (data ?? []).map((row) => {
        const now = new Date();
        const endDate = new Date(row.end_date);
        const isPast = endDate < now;

        return {
          id: row.id,
          club_id: row.club_id,
          program_id: row.program_id,
          title: row.title,
          description: row.description,
          event_type: row.event_type,
          start_date: row.start_date,
          end_date: row.end_date,
          location: row.location,
          max_capacity: row.max_capacity,
          registration_deadline: row.registration_deadline,
          price_member: row.price_member,
          price_non_member: row.price_non_member,
          is_active: row.is_active,
          status: isPast ? 'completed' : 'upcoming',
          created_at: row.created_at,
          updated_at: row.updated_at,
          is_upcoming: !isPast,
          is_past: isPast,
          capacity: {
            max: row.max_capacity,
            current: 0,
            waitlist: false,
          },
          rsvp_count: {
            going: 0,
            maybe: 0,
            not_going: 0,
            not_responded: 0,
            total: 0,
          },
          programs: row.programs as { name: string; program_type: string } | undefined,
        } as Event;
      });
    } catch (error) {
      console.error('Error in getEventsDirect:', error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(eventData: CreateEventData): Promise<Event[]> {
    try {
      // Try edge function first
      const { data, error } = await supabase.functions.invoke('events', {
        method: 'POST',
        body: eventData
      });
      
      if (error) throw error;
      return data || [];
    } catch {
      // Fall back to direct insert
      console.warn('Events edge function unavailable for create, using direct insert');
      const { data, error } = await supabase
        .from('events')
        .insert({
          club_id: eventData.club_id,
          title: eventData.title,
          description: eventData.description,
          event_type: eventData.event_type,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          location: eventData.location,
          max_capacity: eventData.max_capacity,
          registration_deadline: eventData.registration_deadline,
          price_member: eventData.price_member,
          price_non_member: eventData.price_non_member,
          program_id: eventData.program_id,
        })
        .select();

      if (error) throw error;
      return (data ?? []) as Event[];
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
        if (response.status === 404) return null;
        throw new Error(`Edge function returned ${response.status}`);
      }

      const json = await response.json().catch(() => null);
      
      if (json && json.success && json.data) {
        return json.data as Event;
      }
      if (Array.isArray(json)) {
        return json[0] as Event || null;
      }
      if (json && !Array.isArray(json)) {
        return json as Event;
      }
      return null;
    } catch {
      // Fall back to direct Supabase query
      console.warn('Events edge function unavailable for getEventById, using direct query');
      return this.getEventByIdDirect(eventId);
    }
  }

  /**
   * Direct Supabase query fallback for getEventById
   */
  private static async getEventByIdDirect(eventId: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, programs(name, program_type)')
        .eq('id', eventId)
        .single();

      if (error) {
        if ((error as { code?: string }).code === 'PGRST116') return null;
        throw error;
      }
      if (!data) return null;

      const now = new Date();
      const endDate = new Date(data.end_date);
      const isPast = endDate < now;

      return {
        id: data.id,
        club_id: data.club_id,
        program_id: data.program_id,
        title: data.title,
        description: data.description,
        event_type: data.event_type,
        start_date: data.start_date,
        end_date: data.end_date,
        location: data.location,
        max_capacity: data.max_capacity,
        registration_deadline: data.registration_deadline,
        price_member: data.price_member,
        price_non_member: data.price_non_member,
        is_active: data.is_active,
        status: isPast ? 'completed' : 'upcoming',
        created_at: data.created_at,
        updated_at: data.updated_at,
        is_upcoming: !isPast,
        is_past: isPast,
        capacity: {
          max: data.max_capacity,
          current: 0,
          waitlist: false,
        },
        rsvp_count: {
          going: 0,
          maybe: 0,
          not_going: 0,
          not_responded: 0,
          total: 0,
        },
        programs: data.programs as { name: string; program_type: string } | undefined,
      } as Event;
    } catch (error) {
      console.error('Error in getEventByIdDirect:', error);
      throw error;
    }
  }
}
