import { notFound } from "next/navigation";

import { getServerClubBySubdomain } from "@/lib/supabase-server";

/**
 * Tenant root layout. Runs for every request routed through the
 * subdomain rewrite (see proxy.ts). Resolves the club from the URL
 * segment and hands it to children via React context (Phase 4 wires
 * the client provider; for now this layout only validates that the
 * subdomain maps to a real club).
 *
 * If the subdomain doesn't match a club, Next.js renders the
 * sibling `not-found.tsx` ("Tenant not found").
 */
export default async function TenantLayout(
  props: LayoutProps<"/s/[subdomain]">
) {
  const { subdomain } = await props.params;
  const club = await getServerClubBySubdomain(subdomain);

  if (!club) {
    notFound();
  }

  return <>{props.children}</>;
}
