import { supabaseAdmin } from "./supabase.ts";

type ClubAccessRow = {
  id: string;
  owner_id: string | null;
  stripe_account_id: string | null;
  name: string | null;
  subdomain: string | null;
};

export async function getClubForAccess(clubId: string): Promise<ClubAccessRow> {
  const { data, error } = await supabaseAdmin
    .from("clubs")
    .select("id, owner_id, stripe_account_id, name, subdomain")
    .eq("id", clubId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Club not found.");

  return {
    id: String(data.id),
    owner_id: data.owner_id ? String(data.owner_id) : null,
    stripe_account_id: data.stripe_account_id ? String(data.stripe_account_id) : null,
    name: data.name ? String(data.name) : null,
    subdomain: data.subdomain ? String(data.subdomain) : null,
  };
}

export async function assertUserCanManageClub(userId: string, clubId: string): Promise<void> {
  const club = await getClubForAccess(clubId);
  if (club.owner_id && club.owner_id === userId) return;

  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .select("club_id, is_admin, is_super_admin, role")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw userError;

  const role = String(userData?.role ?? "").toLowerCase();
  const sameClub = String(userData?.club_id ?? "") === String(clubId);
  if (
    sameClub &&
    (
      userData?.is_admin === true ||
      userData?.is_super_admin === true ||
      role === "owner" ||
      role === "admin"
    )
  ) {
    return;
  }

  throw new Error("Forbidden.");
}
