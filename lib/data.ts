import { Post, User, Event } from "./types";

// Mock users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Loople Admin",
    role: "Admin",
    avatar: "🏊‍♂️",
    isAdmin: true,
  },
  {
    id: "2",
    name: "Coach Sarah",
    role: "Coach",
    avatar: "👩‍🏫",
    isAdmin: false,
  },
  {
    id: "3",
    name: "Admin Team",
    role: "Admin",
    avatar: "👥",
    isAdmin: true,
  },
  {
    id: "4",
    name: "John Davis",
    role: "Member",
    avatar: "👨‍💼",
    isAdmin: false,
  },
  {
    id: "5",
    name: "Water Polo Introduction",
    role: "Program",
    avatar: "🏐",
    isAdmin: false,
  },
];

// Mock events
export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Summer Swim Meet",
    location: "Main Pool",
    date: "6/15/2025",
    time: "5:00:00 AM",
    description: "Annual summer competition with neighboring clubs",
  },
  {
    id: "2",
    title: "Scrimmage Game",
    location: "Competition Pool",
    date: "Saturday",
    time: "10:00 AM",
    description: "Weekend scrimmage game for practice",
  },
];

// Mock posts
export const mockPosts: Post[] = [
  {
    id: "1",
    user: mockUsers[0],
    content: {
      type: "event",
      text: "Join us for our annual summer competition with neighboring clubs.",
      event: mockEvents[0],
    },
    timestamp: "1 hour ago",
    reactions: 0,
    comments: 0,
    isLiked: false,
  },
  {
    id: "2",
    user: mockUsers[1],
    content: {
      type: "text",
      text: "Reminder about tomorrow's practice schedule change. We'll start at 7:30 AM instead of the usual 6:45 AM due to pool maintenance.",
    },
    timestamp: "2 hours ago",
    reactions: 0,
    comments: 0,
    isLiked: false,
  },
  {
    id: "3",
    user: mockUsers[2],
    content: {
      type: "text",
      text: "Your membership renewal is coming up! Complete the renewal process online through your member portal or at the front desk during operating hours. Early renewal discounts are available until June 15th.",
    },
    timestamp: "Yesterday",
    reactions: 0,
    comments: 0,
    isLiked: false,
  },
  {
    id: "4",
    user: mockUsers[3],
    content: {
      type: "text",
      text: "Just completed my first 1500m freestyle without stopping! Thanks to everyone in the Adult Fitness Swimming program for the encouragement and support.",
    },
    timestamp: "2 days ago",
    reactions: 12,
    comments: 3,
    isLiked: false,
  },
  {
    id: "5",
    user: mockUsers[4],
    content: {
      type: "event",
      text: "Get ready for our weekend scrimmage game! This is a great opportunity to practice the skills we've been working on.",
      event: mockEvents[1],
    },
    timestamp: "3 days ago",
    reactions: 0,
    comments: 0,
    isLiked: false,
  },
];

// Helper function to get relative time
export function getRelativeTime(timestamp: string): string {
  return timestamp;
}

// Helper function to format date
export function formatDate(date: string, time: string): string {
  return `${date} ${time}`;
}
