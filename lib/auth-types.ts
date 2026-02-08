import { z } from "zod";

// Authentication schemas based on Postman collection
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  data: z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
    birth_date: z.string().optional(),
    club_name: z.string().optional(),
    club_subdomain: z.string().optional(),
  }),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// User types based on API response
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    birth_date?: string;
    club_name?: string;
    club_subdomain?: string;
    username?: string;
    avatar_url?: string;
    role?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
    isAdmin?: boolean;
  };
  aud: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

// Club types
export interface Club {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  owner_id: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// User record types
export interface UserRecord {
  id: string;
  club_id: string;
  role_id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

// Member types
export interface Member {
  id: string;
  club_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  member_type: 'individual' | 'family' | 'adult' | 'youth';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_start_date: string;
  membership_end_date?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: AuthError;
  success: boolean;
}

export interface SignUpResponse {
  user: AuthUser;
  session?: AuthSession;
}

export interface SignInResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

// Form types
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>;
