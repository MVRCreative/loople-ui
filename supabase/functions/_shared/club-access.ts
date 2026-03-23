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

  const [memberRes, userRes] = await Promise.all([
    supabaseAdmin
      .from("members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", userId)
      .in("role", ["admin", "Admin"])
      .limit(1),
    supabaseAdmin
      .from("users")
      .select("club_id, is_admin, is_super_admin, role")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (memberRes.error) throw memberRes.error;
  if (userRes.error) throw userRes.error;

  if (memberRes.data && memberRes.data.length > 0) return;

  const role = String(userRes.data?.role ?? "").toLowerCase();
  const sameClub = String(userRes.data?.club_id ?? "") === String(clubId);
  if (
    sameClub &&
    (
      userRes.data?.is_admin === true ||
      userRes.data?.is_super_admin === true ||
      role === "owner" ||
      role === "admin"
    )
  ) {
    return;
  }

  throw new Error("Forbidden.");
}
