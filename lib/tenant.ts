export type TenantContext = {
  subdomain: string | null
  clubSlug: string | null
}

// Resolve tenant subdomain from host, supporting localhost and Vercel preview domains
export function resolveTenantFromHost(hostHeader: string | null | undefined): TenantContext {
  if (!hostHeader) return { subdomain: null, clubSlug: null }

  const host = hostHeader.toLowerCase()

  // localhost: tenant.localhost:3000 or localhost:3000 (no subdomain)
  if (host.endsWith(".localhost:3000") || host.endsWith(".localhost")) {
    const parts = host.replace(":3000", "").split(".")
    if (parts.length >= 2) {
      const sub = parts[0]
      return { subdomain: sub, clubSlug: sub }
    }
    return { subdomain: null, clubSlug: null }
  }

  // Vercel preview: <branch>-<hash>-<sub>.vercel.app or <sub>.vercel.app
  const vercelIdx = host.indexOf(".vercel.app")
  if (vercelIdx > 0) {
    const left = host.slice(0, vercelIdx)
    const parts = left.split("-")
    // Heuristic: last token often is the subdomain if using wildcard; fallback to first label before vercel
    const candidate = parts[parts.length - 1]
    return { subdomain: candidate, clubSlug: candidate }
  }

  // Custom domains: sub.domain.tld
  const labels = host.split(".")
  if (labels.length >= 3) {
    const sub = labels[0]
    return { subdomain: sub, clubSlug: sub }
  }

  return { subdomain: null, clubSlug: null }
}


