import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getServerClubBySubdomain } from "@/lib/supabase-server";

/**
 * Shown when a signed-in user visits a tenant where they are not a
 * member. Phase 5's (member) layout redirects unknown users here.
 */
export default async function NotAMemberPage(
  props: PageProps<"/s/[subdomain]/not-a-member">
) {
  const { subdomain } = await props.params;
  const club = await getServerClubBySubdomain(subdomain);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        You&apos;re not a member of {club?.name ?? "this club"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ask an admin for an invite, or join the club&apos;s waitlist if
        applications are open.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {club?.waitlist_enabled ? (
          <Button asChild>
            <Link href="/waitlist/apply">Apply to join</Link>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href="https://www.loople.app">Switch clubs</Link>
        </Button>
      </div>
    </div>
  );
}
