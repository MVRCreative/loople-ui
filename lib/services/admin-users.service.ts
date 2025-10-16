import { supabase } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

/**
 * Fetches admin users for a specific club
 * Returns members where role is "Admin" or "Owner"
 */
export async function getAdminUsers(clubId: number): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("members")
    .select(`
      id,
      user_id,
      role,
      first_name,
      last_name,
      email
    `)
    .eq("club_id", clubId)
    .in("role", ["Admin", "Owner"])
    .eq("membership_status", "active");

  if (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }

  // Transform the data to match our AdminUser interface
  return (
    data?.map((member: {
      id: number;
      user_id: string | null;
      role: string | null;
      first_name: string;
      last_name: string;
      email: string | null;
    }) => ({
      id: member.user_id || member.id.toString(),
      name: `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Unknown User",
      email: member.email || "",
      avatar_url: undefined, // Not available in members table
      role: member.role || "Admin",
    })) || []
  );
}

/**
 * Mock admin users for client-side development
 * Use this when building UI before database integration
 */
export const mockAdminUsers: AdminUser[] = [
  {
    id: "admin-1",
    name: "Sarah Johnson",
    email: "sarah@club.com",
    role: "Owner",
  },
  {
    id: "admin-2",
    name: "Mike Chen",
    email: "mike@club.com",
    role: "Admin",
  },
  {
    id: "admin-3",
    name: "Emma Wilson",
    email: "emma@club.com",
    role: "Admin",
  },
  {
    id: "admin-4",
    name: "David Martinez",
    email: "david@club.com",
    role: "Admin",
  },
];

