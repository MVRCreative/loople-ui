import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().optional(),
  role: z.string(),
  avatar: z.string(),
  avatar_url: z.string().optional(),
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
    userVote: z.number().nullable().optional(),
  }).optional(),
});

// API User schema (from Supabase)
export const apiUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  avatar_url: z.string().optional(),
  raw_user_meta_data: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
  }).optional(),
});

// Media attachment schema
export const mediaAttachmentSchema = z.object({
  id: z.number(),
  file_name: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  file_type: z.string(),
  created_at: z.string(),
});

// API Post schema (from database)
export const apiPostSchema = z.object({
  id: z.number(),
  club_id: z.number(),
  user_id: z.string(), // UUID as string
  content_type: z.enum(["text", "event", "poll"]),
  content_text: z.string(),
  event_id: z.number().optional(),
  poll_question: z.string().optional(),
  poll_options: z.string().optional(), // JSON string
  poll_votes: z.string().optional(), // JSON string
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  events: eventSchema.optional(),
  users: apiUserSchema.optional(),
  media_attachments: z.array(mediaAttachmentSchema).optional(),
  reaction_count: z.number().optional(),
  comment_count: z.number().optional(),
  reactions_by_type: z.record(z.string(), z.number()).optional(),
  user_vote: z.number().nullable().optional(), // User's vote for poll posts
});

// API Comment schema (from database)
export const apiCommentSchema = z.object({
  id: z.number(),
  post_id: z.number(),
  user_id: z.string(), // UUID as string
  parent_comment_id: z.number().optional(),
  content: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  users: apiUserSchema.optional(),
});

// Frontend Post schema (for UI components)
export const postSchema = z.object({
  id: z.string(),
  user: userSchema,
  content: postContentSchema,
  timestamp: z.string(),
  reactions: z.number().default(0),
  comments: z.number().default(0),
  isLiked: z.boolean().default(false),
  media_attachments: z.array(mediaAttachmentSchema).optional(),
});

// Frontend Comment schema (for UI components)
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

// API types
export type ApiUser = z.infer<typeof apiUserSchema>;
export type ApiPost = z.infer<typeof apiPostSchema>;
export type ApiComment = z.infer<typeof apiCommentSchema>;
export type MediaAttachment = z.infer<typeof mediaAttachmentSchema>;
