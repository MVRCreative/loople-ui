"use client";

import { useState, useCallback } from "react";
import { EventDetail, EventRSVP, EventPost, EventRSVPStatus } from "./types";
import { 
  mockEvents, 
  mockRSVPs, 
  mockEventPosts, 
  getEventById, 
  getRSVPsByEventId, 
  getPostsByEventId 
} from "@/lib/mocks/events";

// Environment flag to enable/disable mock data
const USE_MOCK_EVENTS = process.env.NEXT_PUBLIC_USE_MOCK_EVENTS === "true" || process.env.NODE_ENV === "development";

// Custom hook for events list
export function useEvents() {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (USE_MOCK_EVENTS) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setEvents(mockEvents);
      } else {
        throw new Error("Real API not implemented yet");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

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
        throw new Error("Real API not implemented yet");
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
        throw new Error("Real API not implemented yet");
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
        throw new Error("Real API not implemented yet");
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
