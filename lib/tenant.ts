import { redis } from './redis';
import { createClient } from './server';

export type Tenant = {
  id: number | string;
  slug: string;
  name: string;
  primaryHost?: string | null;
};

// Normalize host: lowercase, strip port
function normalizeHost(host: string): string {
  return host.toLowerCase().split(':')[0];
}

// Get tenant by slug from cache or database
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const cacheKey = `tenant:by-slug:${slug}`;
  
  if (redis) {
    try {
      // Try Redis cache first
      const cached = await redis.get<Tenant>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.warn('Redis cache miss for tenant slug:', slug, error);
    }
  }

  // Database fallback
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, subdomain')
    .eq('subdomain', slug)
    .single();

  if (error || !data) return null;

  const tenant: Tenant = {
    id: data.id,
    slug: data.subdomain,
    name: data.name,
  };

  // Cache with 6h TTL
  if (redis) {
    try {
      await redis.setex(cacheKey, 6 * 60 * 60, tenant);
    } catch (error) {
      console.warn('Failed to cache tenant by slug:', error);
    }
  }

  return tenant;
}

// Get tenant by host from cache or database
export async function getTenantByHost(host: string): Promise<Tenant | null> {
  const normalizedHost = normalizeHost(host);
  const cacheKey = `tenant:by-host:${normalizedHost}`;
  
  if (redis) {
    try {
      // Try Redis cache first
      const cached = await redis.get<Tenant>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.warn('Redis cache miss for tenant host:', normalizedHost, error);
    }
  }

  // Database fallback
  const supabase = await createClient();
  
  // First try: direct domain lookup
  const { data: domainData, error: domainError } = await supabase
    .from('domains')
    .select(`
      club_id,
      clubs!inner(id, name, subdomain)
    `)
    .eq('host', normalizedHost)
    .single();

  if (!domainError && domainData && Array.isArray(domainData.clubs) && domainData.clubs.length > 0) {
    const club = domainData.clubs[0];
    const tenant: Tenant = {
      id: club.id,
      slug: club.subdomain,
      name: club.name,
      primaryHost: normalizedHost,
    };

    // Cache with 6h TTL
    if (redis) {
      try {
        await redis.setex(cacheKey, 6 * 60 * 60, tenant);
      } catch (error) {
        console.warn('Failed to cache tenant by host:', error);
      }
    }

    return tenant;
  }

  // Second try: if host ends with .loople.app, use leftmost label as slug
  if (normalizedHost.endsWith('.loople.app')) {
    const slug = normalizedHost.split('.')[0];
    const tenant = await getTenantBySlug(slug);
    
    if (tenant && redis) {
      // Cache the host mapping
      try {
        await redis.setex(cacheKey, 6 * 60 * 60, tenant);
      } catch (error) {
        console.warn('Failed to cache tenant by host:', error);
      }
    }
    
    return tenant;
  }

  return null;
}

// Legacy function for backward compatibility
export type TenantContext = {
  subdomain: string | null;
  clubSlug: string | null;
};

export function resolveTenantFromHost(hostHeader: string | null | undefined): TenantContext {
  if (!hostHeader) return { subdomain: null, clubSlug: null };

  const host = hostHeader.toLowerCase();

  // localhost: tenant.localhost:3000 or localhost:3000 (no subdomain)
  if (host.endsWith(".localhost:3000") || host.endsWith(".localhost")) {
    const parts = host.replace(":3000", "").split(".");
    if (parts.length >= 2) {
      const sub = parts[0];
      return { subdomain: sub, clubSlug: sub };
    }
    return { subdomain: null, clubSlug: null };
  }

  // Vercel preview: <branch>-<hash>-<sub>.vercel.app or <sub>.vercel.app
  const vercelIdx = host.indexOf(".vercel.app");
  if (vercelIdx > 0) {
    const left = host.slice(0, vercelIdx);
    const parts = left.split("-");
    // Heuristic: last token often is the subdomain if using wildcard; fallback to first label before vercel
    const candidate = parts[parts.length - 1];
    return { subdomain: candidate, clubSlug: candidate };
  }

  // Custom domains: sub.domain.tld
  const labels = host.split(".");
  if (labels.length >= 3) {
    const sub = labels[0];
    return { subdomain: sub, clubSlug: sub };
  }

  return { subdomain: null, clubSlug: null };
}


