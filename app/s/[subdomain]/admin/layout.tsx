import { redirect } from "next/navigation";

import { userHasAdminAccess } from "@/lib/auth/admin-access";
import { env } from "@/lib/env";
import {
  getServerClubBySubdomain,
  getServerSupabase,
} from "@/lib/supabase-server";
import { buildRootUrl, buildTenantUrl } from "@/lib/utils/subdomain";

import { AdminLayoutClient } from "@/app/admin/admin-layout-client";

/**
 * Tenant-scoped admin gate. Resolves the club from the URL, confirms
 * the caller has admin access on THAT club, and then renders the
 * shared admin chrome.
 *
 * Phase 5 will tighten userHasAdminAccess to require a clubId and
 * drop the "any club owned" fallback that currently exists.
 */
export default async function TenantAdminLayout(
  props: LayoutProps<"/s/[subdomain]/admin">
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
    loginUrl.searchParams.set(
      "redirectTo",
      buildTenantUrl(subdomain, env.ROOT_DOMAIN, "/admin")
    );
    redirect(loginUrl.toString());
  }

  // Phase 5 TODO: pass club.id once userHasAdminAccess is clubId-aware.
  const allowed = await userHasAdminAccess(supabase, user);
  if (!allowed) {
    redirect(`/s/${subdomain}`);
  }

  return <AdminLayoutClient>{props.children}</AdminLayoutClient>;
}
