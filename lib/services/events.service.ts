import { supabase } from '../supabase';

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
      const { data, error } = await supabase.functions.invoke('events', {
        method: 'GET',
        query: filters
      });
      
      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }
      
      return data || [];
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
