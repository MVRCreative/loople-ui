import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/app", // your environment's mount path
  assetPrefix: "/app", // ensure this matches your environment's mount path
  logging: {
    // Next.js 16.2 browser log forwarding (errors + warnings into terminal)
    browserToTerminal: "warn",
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/app",
        basePath: false,
        permanent: false,
      },
      // Transitional: after Phase 0 removes basePath, external links pointing
      // at /app/* (emails, Stripe return URLs, bookmarks) keep resolving.
      // Safe while basePath="/app" is still present because the "/" redirect
      // above runs first and routes traffic through basePath normally.
      // Remove after a 30-day grace period post-Phase 6.
      {
        source: "/app/:path*",
        destination: "/:path*",
        basePath: false,
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
    ],
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then((mod) =>
    mod.initOpenNextCloudflareForDev()
  );
}
