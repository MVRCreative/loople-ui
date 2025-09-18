import { EventDetail, EventRSVP, EventListItem, EventFilters } from "./types";

/**
 * Check if an event is upcoming (starts in the future)
 */
export const isUpcoming = (event: EventDetail | EventListItem): boolean => {
  return new Date(event.start_date) > new Date();
};

/**
 * Check if an event is past (has already ended)
 */
export const isPast = (event: EventDetail | EventListItem): boolean => {
  return new Date(event.end_date) < new Date();
};

/**
 * Check if an event is happening now (started but not ended)
 */
export const isHappeningNow = (event: EventDetail | EventListItem): boolean => {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  return now >= start && now <= end;
};

/**
 * Get RSVP counts for an event
 */
export const getRSVPCounts = (rsvps: EventRSVP[]) => {
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
};

/**
 * Find a member's RSVP for an event
 */
export const findMemberRSVP = (rsvps: EventRSVP[], userId: string): EventRSVP | undefined => {
  return rsvps.find(rsvp => rsvp.user_id === userId);
};

/**
 * Get member's RSVP status for an event
 */
export const getMemberRSVPStatus = (rsvps: EventRSVP[], userId: string): EventRSVP["status"] => {
  const rsvp = findMemberRSVP(rsvps, userId);
  return rsvp?.status || "not_responded";
};

/**
 * Check if an event is at capacity
 */
export const isEventAtCapacity = (event: EventDetail): boolean => {
  if (!event.capacity?.max) return false;
  return event.capacity.current >= event.capacity.max;
};

/**
 * Check if an event has a waitlist
 */
export const hasWaitlist = (event: EventDetail): boolean => {
  return Boolean(event.capacity?.waitlist);
};

/**
 * Get available spots for an event
 */
export const getAvailableSpots = (event: EventDetail): number | null => {
  if (!event.capacity?.max) return null;
  return Math.max(0, event.capacity.max - event.capacity.current);
};

/**
 * Format event date for display
 */
export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format event time for display
 */
export const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format event date and time for display
 */
export const formatEventDateTime = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const isSameDay = start.toDateString() === end.toDateString();
  
  if (isSameDay) {
    return `${formatEventDate(startDate)} at ${formatEventTime(startDate)} - ${formatEventTime(endDate)}`;
  } else {
    return `${formatEventDate(startDate)} at ${formatEventTime(startDate)} - ${formatEventDate(endDate)} at ${formatEventTime(endDate)}`;
  }
};

/**
 * Format event location for display
 */
export const formatEventLocation = (location: EventDetail["location"]): string => {
  const parts = [location.name];
  
  if (location.address) {
    parts.push(location.address);
  }
  
  if (location.city && location.state) {
    parts.push(`${location.city}, ${location.state}`);
  } else if (location.city) {
    parts.push(location.city);
  }
  
  if (location.zip) {
    parts.push(location.zip);
  }
  
  return parts.join(", ");
};

/**
 * Get event status display text
 */
export const getEventStatusText = (status: EventDetail["status"]): string => {
  switch (status) {
    case "draft":
      return "Draft";
    case "published":
      return "Published";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return "Unknown";
  }
};

/**
 * Get event visibility display text
 */
export const getEventVisibilityText = (visibility: EventDetail["visibility"]): string => {
  switch (visibility) {
    case "public":
      return "Public";
    case "members_only":
      return "Members Only";
    case "private":
      return "Private";
    default:
      return "Unknown";
  }
};

/**
 * Filter events based on criteria
 */
export const filterEvents = (events: EventDetail[], filters: EventFilters): EventDetail[] => {
  return events.filter(event => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(event.status)) return false;
    }
    
    // Visibility filter
    if (filters.visibility && filters.visibility.length > 0) {
      if (!filters.visibility.includes(event.visibility)) return false;
    }
    
    // Program filter
    if (filters.program) {
      if (event.program?.id !== filters.program) return false;
    }
    
    // Date range filter
    if (filters.date_range) {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      
      if (filters.date_range.start) {
        const filterStart = new Date(filters.date_range.start);
        if (eventEnd < filterStart) return false;
      }
      
      if (filters.date_range.end) {
        const filterEnd = new Date(filters.date_range.end);
        if (eventStart > filterEnd) return false;
      }
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        event.title,
        event.description || "",
        event.location.name,
        event.location.address || "",
        event.location.city || "",
        event.program?.name || "",
      ].join(" ").toLowerCase();
      
      if (!searchableText.includes(searchTerm)) return false;
    }
    
    return true;
  });
};

/**
 * Sort events by date (upcoming first, then by start date)
 */
export const sortEventsByDate = (events: EventDetail[]): EventDetail[] => {
  return [...events].sort((a, b) => {
    // Past events come last
    if (a.is_past && !b.is_past) return 1;
    if (!a.is_past && b.is_past) return -1;
    
    // Within same category, sort by start date
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });
};

/**
 * Sort events by RSVP count (most popular first)
 */
export const sortEventsByRSVPCount = (events: EventDetail[]): EventDetail[] => {
  return [...events].sort((a, b) => {
    return b.rsvp_count.total - a.rsvp_count.total;
  });
};

/**
 * Get events grouped by date
 */
export const groupEventsByDate = (events: EventDetail[]): Record<string, EventDetail[]> => {
  return events.reduce((groups, event) => {
    const date = new Date(event.start_date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, EventDetail[]>);
};

/**
 * Get events grouped by program
 */
export const groupEventsByProgram = (events: EventDetail[]): Record<string, EventDetail[]> => {
  return events.reduce((groups, event) => {
    const programKey = event.program?.id || "no-program";
    if (!groups[programKey]) {
      groups[programKey] = [];
    }
    groups[programKey].push(event);
    return groups;
  }, {} as Record<string, EventDetail[]>);
};
