import { supabase } from '../supabase';

export type AdminProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminClub = {
  id: string;
  slug: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminMembership = {
  id: string;
  club_id: string;
  user_id: string;
  role: string;
  created_at: string | null;
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  club: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export class AdminService {
  static async getAllProfiles(): Promise<AdminProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAllClubs(): Promise<AdminClub[]> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAllMemberships(): Promise<AdminMembership[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        club_id,
        user_id,
        role,
        created_at,
        user:profiles!members_user_id_fkey (
          id,
          email,
          full_name
        ),
        club:clubs!members_club_id_fkey (
          id,
          name,
          slug
        )
      `)
      .returns<AdminMembership[]>()
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}


