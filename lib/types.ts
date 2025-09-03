import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  avatar: z.string(),
  isAdmin: z.boolean().default(false),
});

// Event schema
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  date: z.string(),
  time: z.string(),
  description: z.string().optional(),
});

// Post content schema
export const postContentSchema = z.object({
  type: z.enum(["text", "event", "poll"]),
  text: z.string(),
  event: eventSchema.optional(),
  poll: z.object({
    question: z.string(),
    options: z.array(z.string()),
    votes: z.record(z.string(), z.number()),
  }).optional(),
});

// Post schema
export const postSchema = z.object({
  id: z.string(),
  user: userSchema,
  content: postContentSchema,
  timestamp: z.string(),
  reactions: z.number().default(0),
  comments: z.number().default(0),
  isLiked: z.boolean().default(false),
});

// Comment schema
export const commentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  user: userSchema,
  content: z.string(),
  timestamp: z.string(),
  reactions: z.number().default(0),
});

// Export types
export type User = z.infer<typeof userSchema>;
export type Event = z.infer<typeof eventSchema>;
export type PostContent = z.infer<typeof postContentSchema>;
export type Post = z.infer<typeof postSchema>;
export type Comment = z.infer<typeof commentSchema>;
