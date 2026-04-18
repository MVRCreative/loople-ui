/**
 * Pure helpers for tenant subdomain resolution.
 *
 * Treat these functions as the single source of truth for:
 *  - extracting a tenant subdomain from an incoming host header
 *  - deciding whether a subdomain is reserved (maps to root, not a tenant)
 *  - building canonical tenant / root URLs for cross-subdomain navigation
 *
 * Rules (intentional):
 *  - Multi-label prefixes (`a.b.loople.app`) return null. We only support
 *    single-label tenant subdomains.
 *  - Vercel preview deployments (`*.vercel.app`) always resolve as root
 *    unless ROOT_DOMAIN is explicitly set to `vercel.app`.
 *  - Bare IPs and the apex domain itself resolve as root.
 */

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "preview",
  "status",
  "static",
]);

function stripPort(host: string): string {
  const bracketClose = host.lastIndexOf("]");
  if (bracketClose !== -1) {
    return host.slice(0, bracketClose + 1);
  }
  const colon = host.indexOf(":");
  return colon === -1 ? host : host.slice(0, colon);
}

function normalizeHost(host: string): string {
  return stripPort(host.toLowerCase()).replace(/\.$/, "");
}

function isIpLiteral(host: string): boolean {
  if (host.startsWith("[") || host.includes("::")) return true;
  return /^\d+\.\d+\.\d+\.\d+$/.test(host);
}

export function isLocalDomain(rootDomain: string): boolean {
  const bare = normalizeHost(rootDomain);
  return bare === "localhost" || bare.endsWith(".localhost") || bare === "127.0.0.1";
}

/**
 * Return the tenant subdomain from a request host, or null if the request
 * should be treated as the root domain.
 *
 * @example extractSubdomain("eastside-fc.loople.app", "loople.app") // "eastside-fc"
 * @example extractSubdomain("loople.app", "loople.app")             // null
 * @example extractSubdomain("www.loople.app", "loople.app")         // "www" (reserved)
 * @example extractSubdomain("eastside-fc.localhost:3000", "localhost:3000") // "eastside-fc"
 * @example extractSubdomain("my-branch-abc.vercel.app", "loople.app")       // null
 */
export function extractSubdomain(
  host: string | null | undefined,
  rootDomain: string
): string | null {
  if (!host || !rootDomain) return null;

  const normalizedHost = normalizeHost(host);
  const normalizedRoot = normalizeHost(rootDomain);

  if (!normalizedHost || !normalizedRoot) return null;
  if (normalizedHost === normalizedRoot) return null;
  if (isIpLiteral(normalizedHost)) return null;

  if (
    normalizedHost.endsWith(".vercel.app") &&
    normalizedRoot !== "vercel.app"
  ) {
    return null;
  }

  const suffix = `.${normalizedRoot}`;
  if (!normalizedHost.endsWith(suffix)) return null;

  const prefix = normalizedHost.slice(0, -suffix.length);
  if (!prefix) return null;
  if (prefix.includes(".")) return null;

  return prefix;
}

/**
 * Reserved subdomains never resolve to a tenant. They fall through to
 * root/marketing/auth routing.
 */
export function isReservedSubdomain(sub: string | null | undefined): boolean {
  if (!sub) return false;
  return RESERVED_SUBDOMAINS.has(sub.toLowerCase());
}

/**
 * Tenant subdomain predicate: non-null, non-reserved, syntactically valid.
 */
export function isTenantSubdomain(sub: string | null | undefined): sub is string {
  if (!sub) return false;
  if (isReservedSubdomain(sub)) return false;
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(sub);
}

function joinPath(path: string | undefined): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Build a fully-qualified URL for a tenant subdomain (e.g.
 * "https://eastside-fc.loople.app/admin"). Uses http for local domains.
 */
export function buildTenantUrl(
  subdomain: string,
  rootDomain: string,
  path?: string
): string {
  const protocol = isLocalDomain(rootDomain) ? "http" : "https";
  const host = `${subdomain}.${rootDomain}`;
  return `${protocol}://${host}${joinPath(path)}`;
}

/**
 * Build a fully-qualified URL for the root/www domain
 * (e.g. "https://www.loople.app/auth/login"). On local domains we keep the
 * bare host (e.g. "http://localhost:3000/auth/login") since browsers don't
 * treat `www.localhost` specially.
 */
export function buildRootUrl(rootDomain: string, path?: string): string {
  const local = isLocalDomain(rootDomain);
  const protocol = local ? "http" : "https";
  const host = local ? rootDomain : `www.${rootDomain}`;
  return `${protocol}://${host}${joinPath(path)}`;
}
