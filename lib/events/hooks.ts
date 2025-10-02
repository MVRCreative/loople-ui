"use client";

import { useState, useCallback } from "react";
import { EventDetail, EventRSVP, EventPost, EventRSVPStatus } from "./types";
import { EventsService, Event } from "@/lib/services/events.service";
import { RSVPService, EventRegistration } from "@/lib/services/rsvp.service";
import { useClub } from "@/lib/club-context";
import { 
  mockEvents, 
  getEventById, 
  getRSVPsByEventId, 
  getPostsByEventId 
} from "@/lib/mocks/events";

// Environment flag to enable/disable mock data
const USE_MOCK_EVENTS = process.env.NEXT_PUBLIC_USE_MOCK_EVENTS === "true"; // Use real API by default

// Custom hook for events list
export function useEvents() {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedClub } = useClub();

  const loadEvents = useCallback(async () => {
    if (!selectedClub) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      if (USE_MOCK_EVENTS) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Filter mock events by selected club
        const clubEvents = mockEvents.filter(event => event.club_id === selectedClub.id.toString());
        setEvents(clubEvents);
      } else {
        // Use real API with club_id filter
        const apiEvents = await EventsService.getEvents({ 
          club_id: selectedClub.id,
          is_active: true 
        });
        
        // Transform API events to match frontend EventDetail interface
        const transformedEvents: EventDetail[] = apiEvents.map((event: Event) => {
          const now = new Date();
          const startDate = new Date(event.start_date);
          const endDate = new Date(event.end_date);
          const isPast = endDate < now;
          const isUpcoming = !isPast; // includes ongoing and future

          return {
            id: event.id.toString(),
            title: event.title,
            description: event.description || '',
            start_date: event.start_date,
            end_date: event.end_date,
            location: {
              name: event.location || 'TBD',
              address: undefined,
              city: undefined,
              state: undefined,
              zip: undefined,
            },
            capacity: {
              max: event.max_capacity,
              current: event.event_registrations?.length || 0,
              waitlist: false, // TODO: Calculate based on capacity
            },
            visibility: 'public' as const, // Default to public for now
            status: event.is_active ? 'published' as const : 'draft' as const,
            program: event.programs ? {
              id: event.program_id?.toString() || '',
              name: event.programs.name,
              description: undefined,
            } : undefined,
            club_id: event.club_id.toString(),
            created_by: '', // Not available in current API
            created_at: event.created_at,
            updated_at: event.updated_at,
            is_upcoming: isUpcoming,
            is_past: isPast,
            rsvp_count: {
              going: event.event_registrations?.filter((r: { status: string }) => r.status === 'confirmed').length || 0,
              maybe: event.event_registrations?.filter((r: { status: string }) => r.status === 'registered').length || 0,
              not_going: 0,
              total: event.event_registrations?.length || 0,
            },
            image_url: undefined,
          };
        });
        
        setEvents(transformedEvents);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [selectedClub]);

  return { events, loading, error, loadEvents };
}

// Custom hook for single event
export function useEvent(eventId: string) {
  const [event, setEvent] = useState<EventDetail | undefined>(undefined);
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [posts, setPosts] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (USE_MOCK_EVENTS) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const eventData = getEventById(eventId);
        const rsvpData = getRSVPsByEventId(eventId);
        const postData = getPostsByEventId(eventId);
        
        setEvent(eventData);
        setRsvps(rsvpData);
        setPosts(postData);
      } else {
        // Use real API - get single event by ID
        const apiEvent = await EventsService.getEventById(eventId);
        
        console.log('API Event received:', apiEvent);
        
        if (!apiEvent) {
          setEvent(undefined);
          setRsvps([]);
          setPosts([]);
          return;
        }
        
        // Transform API event to match frontend EventDetail interface
        const now = new Date();
        const startDate = new Date(apiEvent.start_date || now);
        const endDate = new Date(apiEvent.end_date || now);
        const isPast = endDate < now;
        const isUpcoming = !isPast; // includes ongoing and future
        
        const transformedEvent: EventDetail = {
          id: apiEvent.id?.toString() || '',
          title: apiEvent.title || 'Untitled Event',
          description: apiEvent.description || '',
          start_date: apiEvent.start_date || new Date().toISOString(),
          end_date: apiEvent.end_date || new Date().toISOString(),
          location: {
            name: apiEvent.location || 'TBD',
            address: undefined,
            city: undefined,
            state: undefined,
            zip: undefined,
          },
          capacity: {
            max: apiEvent.max_capacity || undefined,
            current: apiEvent.event_registrations?.length || 0,
            waitlist: false, // TODO: Calculate based on capacity
          },
          visibility: 'public' as const, // Default to public for now
          status: apiEvent.is_active ? 'published' as const : 'draft' as const,
          program: apiEvent.programs ? {
            id: apiEvent.program_id?.toString() || '',
            name: apiEvent.programs.name || 'Unknown Program',
            description: undefined,
          } : undefined,
          club_id: apiEvent.club_id?.toString() || '',
          created_by: '', // Not available in current API
          created_at: apiEvent.created_at || new Date().toISOString(),
          updated_at: apiEvent.updated_at || new Date().toISOString(),
          is_upcoming: isUpcoming,
          is_past: isPast,
          rsvp_count: {
            going: apiEvent.event_registrations?.filter((r: { status: string }) => r.status === 'confirmed').length || 0,
            maybe: apiEvent.event_registrations?.filter((r: { status: string }) => r.status === 'registered').length || 0,
            not_going: 0,
            total: apiEvent.event_registrations?.length || 0,
          },
          image_url: undefined,
        };
        
        setEvent(transformedEvent);
        setRsvps([]); // TODO: Implement RSVP loading from API
        setPosts([]); // TODO: Implement posts loading from API
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  return { event, rsvps, posts, loading, error, loadEvent };
}

// Custom hook for RSVP functionality
export function useRSVP(eventId: string, userId: string) {
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRSVPs = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (USE_MOCK_EVENTS) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        setRsvps(getRSVPsByEventId(eventId));
      } else {
        // Use real API
        const registrations = await RSVPService.getEventRSVPs(eventId);
        
        // Transform API registrations to frontend EventRSVP format
        const transformedRSVPs: EventRSVP[] = registrations.map((reg: EventRegistration) => ({
          id: reg.id.toString(),
          event_id: reg.event_id.toString(),
          user_id: reg.members.user_id,
          status: mapRegistrationStatusToRSVPStatus(reg.status),
          responded_at: reg.registration_date,
          created_at: reg.created_at,
          updated_at: reg.updated_at,
          user: {
            id: reg.members.user_id,
            name: `${reg.members.first_name} ${reg.members.last_name}`,
            avatar: "👤",
            role: "Member",
          },
        }));
        
        setRsvps(transformedRSVPs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RSVPs");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const updateRSVP = useCallback(async (status: EventRSVPStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      if (USE_MOCK_EVENTS) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Find existing RSVP
        const existingRSVP = rsvps.find(rsvp => rsvp.user_id === userId);
        const now = new Date().toISOString();
        
        if (existingRSVP) {
          // Update existing RSVP
          setRsvps(prev => prev.map(rsvp =>
            rsvp.id === existingRSVP.id
              ? { ...rsvp, status, updated_at: now, responded_at: now }
              : rsvp
          ));
        } else {
          // Create new RSVP
          const newRSVP: EventRSVP = {
            id: `rsvp-${Date.now()}`,
            event_id: eventId,
            user_id: userId,
            status,
            responded_at: now,
            created_at: now,
            updated_at: now,
            user: {
              id: userId,
              name: "Current User",
              avatar: "👤",
              role: "Member",
            },
          };
          
          setRsvps(prev => [...prev, newRSVP]);
        }
      } else {
        // Use real API
        const registrationStatus = mapRSVPStatusToRegistrationStatus(status);
        const updatedRegistration = await RSVPService.updateRSVP(eventId, registrationStatus);
        
        // Update local state
        const transformedRSVP: EventRSVP = {
          id: updatedRegistration.id.toString(),
          event_id: updatedRegistration.event_id.toString(),
          user_id: updatedRegistration.members.user_id,
          status: mapRegistrationStatusToRSVPStatus(updatedRegistration.status),
          responded_at: updatedRegistration.registration_date,
          created_at: updatedRegistration.created_at,
          updated_at: updatedRegistration.updated_at,
          user: {
            id: updatedRegistration.members.user_id,
            name: `${updatedRegistration.members.first_name} ${updatedRegistration.members.last_name}`,
            avatar: "👤",
            role: "Member",
          },
        };
        
        // Update or add to local state
        setRsvps(prev => {
          const existingIndex = prev.findIndex(rsvp => rsvp.user_id === userId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = transformedRSVP;
            return updated;
          } else {
            return [...prev, transformedRSVP];
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update RSVP");
    } finally {
      setLoading(false);
    }
  }, [eventId, userId, rsvps]);

  const getUserRSVP = useCallback(() => {
    return rsvps.find(rsvp => rsvp.user_id === userId);
  }, [rsvps, userId]);

  return { 
    rsvps, 
    loading, 
    error, 
    loadRSVPs, 
    updateRSVP, 
    getUserRSVP 
  };
}

// Helper function to map registration status to RSVP status
function mapRegistrationStatusToRSVPStatus(registrationStatus: string): EventRSVPStatus {
  switch (registrationStatus) {
    case 'confirmed':
      return 'going';
    case 'registered':
      return 'maybe';
    case 'canceled':
      return 'not_going';
    case 'waitlisted':
      return 'maybe';
    case 'attended':
      return 'going';
    default:
      return 'not_responded';
  }
}

// Helper function to map RSVP status to registration status
function mapRSVPStatusToRegistrationStatus(rsvpStatus: EventRSVPStatus): 'registered' | 'confirmed' | 'canceled' | 'waitlisted' | 'attended' {
  switch (rsvpStatus) {
    case 'going':
      return 'confirmed';
    case 'maybe':
      return 'registered';
    case 'not_going':
      return 'canceled';
    case 'not_responded':
      return 'registered';
    default:
      return 'registered';
  }
}

// Helper function to get RSVP counts
export function getRSVPCounts(rsvps: EventRSVP[]) {
  return rsvps.reduce(
    (counts, rsvp) => {
      counts[rsvp.status] = (counts[rsvp.status] || 0) + 1;
      counts.total += 1;
      return counts;
    },
    {
      going: 0,
      maybe: 0,
      not_going: 0,
      not_responded: 0,
      total: 0,
    }
  );
}

// Helper function to find member's RSVP
export function findMemberRSVP(rsvps: EventRSVP[], userId: string): EventRSVP | undefined {
  return rsvps.find(rsvp => rsvp.user_id === userId);
}

// Helper function to get member's RSVP status
export function getMemberRSVPStatus(rsvps: EventRSVP[], userId: string): EventRSVPStatus {
  const rsvp = findMemberRSVP(rsvps, userId);
  return rsvp?.status || "not_responded";
}
