import { redirect } from "next/navigation";

import { userIsMemberOfClub } from "@/lib/auth/admin-access";
import { CurrentClubProvider } from "@/lib/club-context";
import { env } from "@/lib/env";
import {
  getServerClubBySubdomain,
  getServerFullClubBySubdomain,
  getServerSupabase,
} from "@/lib/supabase-server";
import { buildRootUrl } from "@/lib/utils/subdomain";

/**
 * Member-only gate for tenant pages. Today this layout:
 *  - Requires an authenticated session (bounces unauth to www/auth/login)
 *  - Validates the subdomain maps to a real club
 *
 * Phase 5 extends this to enforce "is this user a member of this
 * club?" by calling a userIsMemberOfClub helper and redirecting to
 * /s/[subdomain]/not-a-member on failure.
 */
export default async function MemberLayout(
  props: LayoutProps<"/s/[subdomain]">
) {
  const { subdomain } = await props.params;
  const club = await getServerClubBySubdomain(subdomain);
  if (!club) {
    redirect(buildRootUrl(env.ROOT_DOMAIN));
  }

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL(buildRootUrl(env.ROOT_DOMAIN, "/auth/login"));
    loginUrl.searchParams.set("redirectTo", `/s/${subdomain}`);
    redirect(loginUrl.toString());
  }

  // Scope check: only members of THIS club can see member pages.
  const isMember = await userIsMemberOfClub(supabase, user, club.id);
  if (!isMember) {
    redirect(`/s/${subdomain}/not-a-member`);
  }

  // Once the member is authenticated, RLS lets us load the full club row
  // so `useClub()`-style consumers get the full shape (owner_id, etc.).
  const fullClub = await getServerFullClubBySubdomain(subdomain);

  return (
    <CurrentClubProvider initialClub={fullClub}>
      {props.children}
    </CurrentClubProvider>
  );
}
