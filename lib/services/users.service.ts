import { supabase } from '../supabase';

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  club_id: string;
  role_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  username?: string | null;
  bio?: string | null;
  cover_url?: string | null;
  country?: string | null;
  street_address?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  created_at: string;
  updated_at: string;
  role?: {
    name: string;
    permissions: string[];
  };
}

export interface CreateUserData {
  id: string;
  club_id: string;
  role_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UserPreferences {
  id?: number;
  user_id: string;
  notify_comments: boolean;
  notify_candidates: boolean;
  notify_offers: boolean;
  push_notifications: 'everything' | 'same_as_email' | 'none';
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  username?: string | null;
  bio?: string | null;
  cover_url?: string | null;
  country?: string | null;
  street_address?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
}

export interface UpdateUserPreferencesData {
  notify_comments?: boolean;
  notify_candidates?: boolean;
  notify_offers?: boolean;
  push_notifications?: 'everything' | 'same_as_email' | 'none';
}

export class UsersService {
  /**
   * Create a user record
   */
  static async createUser(userData: CreateUserData): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select();
      
      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(name, permissions)
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  }

  /**
   * Get users by club ID
   */
  static async getUsersByClub(clubId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(name, permissions)
        `)
        .eq('club_id', clubId);
      
      if (error) {
        console.error('Error fetching users by club:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getUsersByClub:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updates: Partial<CreateUserData>): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }

  /**
   * Get role by name
   */
  static async getRoleByName(roleName: string): Promise<Role | null> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('name', roleName)
        .single();
      
      if (error) {
        console.error('Error fetching role:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getRoleByName:', error);
      throw error;
    }
  }

  /**
   * Get all roles
   */
  static async getAllRoles(): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*');
      
      if (error) {
        console.error('Error fetching roles:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllRoles:', error);
      throw error;
    }
  }

  /**
   * Get user profile with preferences
   */
  static async getUserProfile(): Promise<User & { preferences: UserPreferences }> {
    try {
      const { data, error } = await supabase.functions.invoke('users', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      // Edge function returns { success, data }
      const payload = data as { success?: boolean; data?: any; error?: any }
      if (payload && payload.success && payload.data) {
        return payload.data as User & { preferences: UserPreferences };
      }
      throw new Error(payload?.error || 'Failed to load user profile');
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(updates: UpdateUserProfileData): Promise<User> {
    try {
      const { data, error } = await supabase.functions.invoke('users', {
        method: 'PUT',
        body: updates
      });
      
      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
      const payload = data as { success?: boolean; data?: any; error?: any }
      if (payload && payload.success && payload.data) {
        return payload.data as User;
      }
      const e = new Error(payload?.error || 'Failed to update user profile') as any
      ;(e as any).status = 400
      throw e
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(preferences: UpdateUserPreferencesData): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase.functions.invoke('users', {
        method: 'PATCH',
        body: preferences
      });
      
      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }
      const payload = data as { success?: boolean; data?: any; error?: any }
      if (payload && payload.success && payload.data) {
        return payload.data as UserPreferences;
      }
      throw new Error(payload?.error || 'Failed to update user preferences')
    } catch (error) {
      console.error('Error in updateUserPreferences:', error);
      throw error;
    }
  }
}
