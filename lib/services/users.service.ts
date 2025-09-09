import { supabase } from '../supabase';

export interface User {
  id: string;
  club_id: string;
  role_id: string;
  email: string;
  first_name: string;
  last_name: string;
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

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
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
}
