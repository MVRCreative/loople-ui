// Event RSVP status enum
export type EventRSVPStatus = "going" | "maybe" | "not_going" | "not_responded";

// Event visibility enum
export type EventVisibility = "public" | "members_only" | "private";

// Event status enum
export type EventStatus = "draft" | "published" | "cancelled" | "completed";

// Event capacity interface
export interface EventCapacity {
  max?: number;
  current: number;
  waitlist: boolean;
}

// Event location interface
export interface EventLocation {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Event program interface (for program-based events)
export interface EventProgram {
  id: string;
  name: string;
  description?: string;
}

// Main Event interface (detailed version for events feature)
export interface EventDetail {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: EventLocation;
  capacity?: EventCapacity;
  visibility: EventVisibility;
  status: EventStatus;
  program?: EventProgram;
  club_id: string;
  created_by: string; // user ID
  created_at: string;
  updated_at: string;
  // Computed fields
  is_upcoming: boolean;
  is_past: boolean;
  rsvp_count: {
    going: number;
    maybe: number;
    not_going: number;
    total: number;
  };
  image_url?: string;
}

// Event RSVP interface
export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: EventRSVPStatus;
  responded_at: string;
  created_at: string;
  updated_at: string;
  // User info (joined from users table)
  user: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
}

// Event Post interface (for posts within an event)
export interface EventPost {
  id: string;
  event_id: string;
  post_id: string;
  created_at: string;
  // Post data (joined from posts table)
  post: {
    id: string;
    content: string;
    content_type: "text" | "event" | "poll";
    user_id: string;
    created_at: string;
    // User info
    user: {
      id: string;
      name: string;
      avatar: string;
      role: string;
    };
  };
}

// Event creation/update interfaces
export interface CreateEventData {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: EventLocation;
  capacity?: EventCapacity;
  visibility: EventVisibility;
  program?: string; // program ID
}

export interface UpdateEventData extends Partial<CreateEventData> {
  status?: EventStatus;
}

// RSVP update interface
export interface UpdateRSVPData {
  status: EventRSVPStatus;
}

// Event filters interface
export interface EventFilters {
  status?: EventStatus[];
  visibility?: EventVisibility[];
  program?: string;
  date_range?: {
    start?: string;
    end?: string;
  };
  search?: string;
}

// Program derived from events (for sidebar, programs page)
export interface ProgramWithNextEvent {
  id: string;
  name: string;
  description?: string;
  nextEvent?: {
    id: string;
    title: string;
    start_date: string;
  };
}

// Event list item (simplified for lists)
export interface EventListItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: EventLocation;
  visibility: EventVisibility;
  status: EventStatus;
  is_upcoming: boolean;
  is_past: boolean;
  rsvp_count: {
    going: number;
    maybe: number;
    not_going: number;
    total: number;
  };
  program_name?: string;
  image_url?: string;
}