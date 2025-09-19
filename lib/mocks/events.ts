import { EventDetail, EventRSVP, EventPost, EventListItem } from "@/lib/events/types";
import { User } from "@/lib/types";

// Mock users for events
const mockEventUsers: User[] = [
  {
    id: "user-1",
    name: "Sarah Johnson",
    role: "Coach",
    avatar: "👩‍🏫",
    isAdmin: false,
  },
  {
    id: "user-2", 
    name: "Mike Chen",
    role: "Member",
    avatar: "👨‍💼",
    isAdmin: false,
  },
  {
    id: "user-3",
    name: "Emma Davis",
    role: "Member", 
    avatar: "👩‍🎓",
    isAdmin: false,
  },
  {
    id: "user-4",
    name: "Alex Rodriguez",
    role: "Member",
    avatar: "👨‍🏊‍♂️",
    isAdmin: false,
  },
  {
    id: "user-5",
    name: "Lisa Wang",
    role: "Admin",
    avatar: "👩‍💻",
    isAdmin: true,
  },
];

// Mock events data
export const mockEvents: EventDetail[] = [
  {
    id: "event-1",
    title: "Swim Team Practice",
    description: "Regular practice session for all team members. Focus on technique and endurance.",
    start_date: "2024-02-15T18:00:00Z",
    end_date: "2024-02-15T20:00:00Z",
    location: {
      name: "Community Pool",
      address: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
    },
    capacity: {
      max: 20,
      current: 15,
      waitlist: false,
    },
    visibility: "public",
    status: "published",
    program: {
      id: "program-1",
      name: "Competitive Swimming",
      description: "Advanced swimming program for competitive athletes",
    },
    club_id: "club-1",
    created_by: "user-1",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    is_upcoming: true,
    is_past: false,
    rsvp_count: {
      going: 12,
      maybe: 3,
      not_going: 2,
      total: 17,
    },
  },
  {
    id: "event-2",
    title: "Water Polo Tournament",
    description: "Annual water polo tournament featuring teams from across the region.",
    start_date: "2024-02-20T09:00:00Z",
    end_date: "2024-02-20T17:00:00Z",
    location: {
      name: "Regional Sports Complex",
      address: "456 Sports Way",
      city: "Springfield",
      state: "IL", 
      zip: "62702",
    },
    capacity: {
      max: 50,
      current: 35,
      waitlist: true,
    },
    visibility: "public",
    status: "published",
    program: {
      id: "program-2",
      name: "Water Polo",
      description: "Water polo training and competition program",
    },
    club_id: "club-1",
    created_by: "user-5",
    created_at: "2024-01-10T14:30:00Z",
    updated_at: "2024-01-10T14:30:00Z",
    is_upcoming: true,
    is_past: false,
    rsvp_count: {
      going: 28,
      maybe: 7,
      not_going: 5,
      total: 40,
    },
  },
  {
    id: "event-3",
    title: "Swimming Technique Workshop",
    description: "Learn advanced swimming techniques from professional coaches.",
    start_date: "2024-01-25T14:00:00Z",
    end_date: "2024-01-25T16:00:00Z",
    location: {
      name: "University Pool",
      address: "789 University Ave",
      city: "Springfield",
      state: "IL",
      zip: "62703",
    },
    capacity: {
      max: 15,
      current: 15,
      waitlist: true,
    },
    visibility: "members_only",
    status: "published",
    club_id: "club-1",
    created_by: "user-1",
    created_at: "2024-01-05T09:00:00Z",
    updated_at: "2024-01-05T09:00:00Z",
    is_upcoming: false,
    is_past: true,
    rsvp_count: {
      going: 15,
      maybe: 0,
      not_going: 3,
      total: 18,
    },
  },
  {
    id: "event-4",
    title: "Draft Event - Team Meeting",
    description: "Internal team meeting to discuss upcoming season plans.",
    start_date: "2024-02-25T19:00:00Z",
    end_date: "2024-02-25T21:00:00Z",
    location: {
      name: "Club Office",
      address: "321 Club Street",
      city: "Springfield",
      state: "IL",
      zip: "62704",
    },
    capacity: {
      max: 10,
      current: 0,
      waitlist: false,
    },
    visibility: "private",
    status: "draft",
    club_id: "club-1",
    created_by: "user-5",
    created_at: "2024-01-20T16:00:00Z",
    updated_at: "2024-01-20T16:00:00Z",
    is_upcoming: true,
    is_past: false,
    rsvp_count: {
      going: 0,
      maybe: 0,
      not_going: 0,
      total: 0,
    },
  },
];

// Mock RSVPs
export const mockRSVPs: EventRSVP[] = [
  // Event 1 RSVPs
  {
    id: "rsvp-1",
    event_id: "event-1",
    user_id: "user-1",
    status: "going",
    responded_at: "2024-01-15T10:30:00Z",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    user: mockEventUsers[0],
  },
  {
    id: "rsvp-2",
    event_id: "event-1",
    user_id: "user-2",
    status: "going",
    responded_at: "2024-01-15T11:00:00Z",
    created_at: "2024-01-15T11:00:00Z",
    updated_at: "2024-01-15T11:00:00Z",
    user: mockEventUsers[1],
  },
  {
    id: "rsvp-3",
    event_id: "event-1",
    user_id: "user-3",
    status: "maybe",
    responded_at: "2024-01-16T09:00:00Z",
    created_at: "2024-01-16T09:00:00Z",
    updated_at: "2024-01-16T09:00:00Z",
    user: mockEventUsers[2],
  },
  // Event 2 RSVPs
  {
    id: "rsvp-4",
    event_id: "event-2",
    user_id: "user-1",
    status: "going",
    responded_at: "2024-01-10T15:00:00Z",
    created_at: "2024-01-10T15:00:00Z",
    updated_at: "2024-01-10T15:00:00Z",
    user: mockEventUsers[0],
  },
  {
    id: "rsvp-5",
    event_id: "event-2",
    user_id: "user-4",
    status: "going",
    responded_at: "2024-01-11T08:00:00Z",
    created_at: "2024-01-11T08:00:00Z",
    updated_at: "2024-01-11T08:00:00Z",
    user: mockEventUsers[3],
  },
  // Event 3 RSVPs (past event)
  {
    id: "rsvp-6",
    event_id: "event-3",
    user_id: "user-2",
    status: "going",
    responded_at: "2024-01-05T10:00:00Z",
    created_at: "2024-01-05T10:00:00Z",
    updated_at: "2024-01-05T10:00:00Z",
    user: mockEventUsers[1],
  },
];

// Mock event posts
export const mockEventPosts: EventPost[] = [
  {
    id: "event-post-1",
    event_id: "event-1",
    post_id: "post-1",
    created_at: "2024-01-15T12:00:00Z",
    post: {
      id: "post-1",
      content: "Looking forward to practice today! Don't forget your goggles and water bottles.",
      content_type: "text",
      user_id: "user-1",
      created_at: "2024-01-15T12:00:00Z",
      user: mockEventUsers[0],
    },
  },
  {
    id: "event-post-2",
    event_id: "event-1",
    post_id: "post-2",
    created_at: "2024-01-15T13:30:00Z",
    post: {
      id: "post-2",
      content: "Practice was great today! Thanks everyone for the hard work.",
      content_type: "text",
      user_id: "user-2",
      created_at: "2024-01-15T13:30:00Z",
      user: mockEventUsers[1],
    },
  },
  {
    id: "event-post-3",
    event_id: "event-2",
    post_id: "post-3",
    created_at: "2024-01-10T16:00:00Z",
    post: {
      id: "post-3",
      content: "Tournament brackets are now available! Check the pinned post for details.",
      content_type: "text",
      user_id: "user-5",
      created_at: "2024-01-10T16:00:00Z",
      user: mockEventUsers[4],
    },
  },
];

// Helper functions to get data by event ID
export const getEventById = (eventId: string): EventDetail | undefined => {
  return mockEvents.find(event => event.id === eventId);
};

export const getRSVPsByEventId = (eventId: string): EventRSVP[] => {
  return mockRSVPs.filter(rsvp => rsvp.event_id === eventId);
};

export const getPostsByEventId = (eventId: string): EventPost[] => {
  return mockEventPosts.filter(post => post.event_id === eventId);
};

export const getUpcomingEvents = (): EventDetail[] => {
  return mockEvents.filter(event => event.is_upcoming);
};

export const getPastEvents = (): EventDetail[] => {
  return mockEvents.filter(event => event.is_past);
};

export const getPublishedEvents = (): EventDetail[] => {
  return mockEvents.filter(event => event.status === "published");
};

export const getDraftEvents = (): EventDetail[] => {
  return mockEvents.filter(event => event.status === "draft");
};

// Convert EventDetail to EventListItem
export const toEventListItem = (event: EventDetail): EventListItem => {
  return {
    id: event.id,
    title: event.title,
    start_date: event.start_date,
    end_date: event.end_date,
    location: event.location,
    visibility: event.visibility,
    status: event.status,
    is_upcoming: event.is_upcoming,
    is_past: event.is_past,
    rsvp_count: event.rsvp_count,
    program_name: event.program?.name,
  };
};

// Get event list items
export const getEventListItems = (): EventListItem[] => {
  return mockEvents.map(toEventListItem);
};

export const getUpcomingEventListItems = (): EventListItem[] => {
  return getUpcomingEvents().map(toEventListItem);
};

export const getPastEventListItems = (): EventListItem[] => {
  return getPastEvents().map(toEventListItem);
};
