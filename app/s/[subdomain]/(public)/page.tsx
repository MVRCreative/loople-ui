import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getServerClubBySubdomain } from "@/lib/supabase-server";

/**
 * Public landing for a tenant subdomain. Placeholder until the real
 * marketing + waitlist surface lands. Visitors reach this at
 * `https://<sub>.loople.app/` when they are not signed in (or not
 * signed in as a member).
 */
export default async function TenantPublicHome(
  props: PageProps<"/s/[subdomain]">
) {
  const { subdomain } = await props.params;
  const club = await getServerClubBySubdomain(subdomain);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        Welcome to {club?.name ?? "this club"}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This is the public landing page for your club. Members, sign in
        to reach your dashboard.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="https://www.loople.app/auth/login">Sign in</Link>
        </Button>
        {club?.waitlist_enabled ? (
          <Button variant="outline" asChild>
            <Link href="/waitlist/apply">Join the waitlist</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
