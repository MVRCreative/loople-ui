import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { isLocalDomain } from "@/lib/utils/subdomain";

/**
 * Server-side Supabase client bound to the current request's cookie
 * store. Use from Server Components, Route Handlers, and Server Actions.
 *
 * Cookie writes are best-effort: calling this from a Server Component
 * during rendering throws because Next.js doesn't let RSCs set cookies.
 * That's fine - the proxy refreshes the session on every request, so
 * by the time an RSC runs the cookies are already up to date.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  const cookieDomain = isLocalDomain(env.ROOT_DOMAIN)
    ? undefined
    : `.${env.ROOT_DOMAIN}`;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const merged = cookieDomain
                ? { ...options, domain: cookieDomain }
                : options;
              cookieStore.set(name, value, merged);
            });
          } catch {
            /* RSC render-time set-cookie is disallowed; proxy handles it */
          }
        },
      },
    }
  );
}

/**
 * Resolve a tenant club from the server using the public RPC. Returns
 * null when no club matches. Safe to call before authentication.
 */
export async function getServerClubBySubdomain(subdomain: string) {
  const trimmed = subdomain?.trim();
  if (!trimmed) return null;

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("club_by_subdomain", {
    sub: trimmed,
  });

  if (error) {
    console.error("Error resolving club by subdomain (server):", error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;

  const r = row as {
    id: unknown;
    name: unknown;
    subdomain: unknown;
    logo_url: unknown;
    onboarding_completed: unknown;
    waitlist_enabled: unknown;
  };

  return {
    id: String(r.id ?? ""),
    name: typeof r.name === "string" ? r.name : "",
    subdomain: typeof r.subdomain === "string" ? r.subdomain : "",
    logo_url: typeof r.logo_url === "string" ? r.logo_url : null,
    onboarding_completed: Boolean(r.onboarding_completed),
    waitlist_enabled: Boolean(r.waitlist_enabled),
  };
}
