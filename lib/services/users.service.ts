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
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(name, permissions)
        `)
        .eq('username', username)
        .single();
      
      if (error) {
        console.error('Error fetching user by username:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
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
      // Try edge function first
      const { data, error } = await supabase.functions.invoke('users', {
        method: 'GET'
      });
      
      if (error) throw error;

      type EdgeFunctionResponse<T> = { success?: boolean; data?: T; error?: unknown }
      const payload = data as EdgeFunctionResponse<User & { preferences: UserPreferences }>
      if (payload?.success && payload.data) {
        return payload.data
      }
      throw new Error('Edge function returned unexpected format')
    } catch {
      // Fall back to direct Supabase query
      console.warn('Users edge function unavailable, using direct query');
      return this.getUserProfileDirect();
    }
  }

  /**
   * Direct query fallback for getUserProfile
   */
  private static async getUserProfileDirect(): Promise<User & { preferences: UserPreferences }> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const { data: profile, error } = await supabase
      .from('users')
      .select('*, role:roles(name, permissions)')
      .eq('id', authUser.id)
      .single();

    if (error) throw error;
    if (!profile) throw new Error('User profile not found');

    // Try to get preferences, return defaults if not found
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();

    const defaultPreferences: UserPreferences = {
      user_id: authUser.id,
      notify_comments: true,
      notify_candidates: false,
      notify_offers: false,
      push_notifications: 'everything',
    };

    return {
      ...profile,
      preferences: prefs ?? defaultPreferences,
    } as User & { preferences: UserPreferences };
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(updates: UpdateUserProfileData): Promise<User> {
    try {
      // Try edge function first
      const { data, error } = await supabase.functions.invoke('users', {
        method: 'PUT',
        body: updates
      });
      
      if (error) throw error;

      type EdgeFunctionResponse<T> = { success?: boolean; data?: T; error?: unknown }
      const payload = data as EdgeFunctionResponse<User>
      if (payload?.success && payload.data) {
        return payload.data
      }
      throw new Error('Edge function returned unexpected format')
    } catch {
      // Fall back to direct Supabase update
      console.warn('Users edge function unavailable, using direct update');
      return this.updateUserProfileDirect(updates);
    }
  }

  /**
   * Direct update fallback for updateUserProfile
   */
  private static async updateUserProfileDirect(updates: UpdateUserProfileData): Promise<User> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // Build update payload, only include non-undefined fields
    const payload: Record<string, unknown> = {};
    const allowedKeys: (keyof UpdateUserProfileData)[] = [
      'first_name', 'last_name', 'phone', 'avatar_url',
      'username', 'bio', 'cover_url', 'country',
      'street_address', 'city', 'region', 'postal_code',
    ];

    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        payload[key] = updates[key];
      }
    }

    // Build full_name from first + last
    if (updates.first_name !== undefined || updates.last_name !== undefined) {
      const first = updates.first_name ?? '';
      const last = updates.last_name ?? '';
      payload.full_name = `${first} ${last}`.trim();
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) {
      const err = new Error(error.message) as Error & { status?: number };
      err.status = 400;
      throw err;
    }

    return data as User;
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(preferences: UpdateUserPreferencesData): Promise<UserPreferences> {
    try {
      // Try edge function first
      const { data, error } = await supabase.functions.invoke('users', {
        method: 'PATCH',
        body: preferences
      });
      
      if (error) throw error;

      type EdgeFunctionResponse<T> = { success?: boolean; data?: T; error?: unknown }
      const payload = data as EdgeFunctionResponse<UserPreferences>
      if (payload?.success && payload.data) {
        return payload.data
      }
      throw new Error('Edge function returned unexpected format')
    } catch {
      // Fall back — preferences table may not exist, just return defaults
      console.warn('User preferences update via edge function failed, attempting direct upsert');
      return this.updateUserPreferencesDirect(preferences);
    }
  }

  /**
   * Direct upsert fallback for updateUserPreferences
   */
  private static async updateUserPreferencesDirect(preferences: UpdateUserPreferencesData): Promise<UserPreferences> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    // Try upserting into user_preferences; if the table doesn't exist, return defaults
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: authUser.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data as UserPreferences;
    } catch {
      // Table may not exist — return defaults silently
      return {
        user_id: authUser.id,
        notify_comments: preferences.notify_comments ?? true,
        notify_candidates: preferences.notify_candidates ?? false,
        notify_offers: preferences.notify_offers ?? false,
        push_notifications: preferences.push_notifications ?? 'everything',
      };
    }
  }
}
