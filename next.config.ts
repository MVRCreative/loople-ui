import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    // Next.js 16.2 browser log forwarding (errors + warnings into terminal)
    browserToTerminal: "warn",
  },
  async redirects() {
    return [
      // Transitional: legacy /app/* URLs (emails, Stripe return URLs,
      // bookmarks) keep resolving now that basePath has been removed.
      // Remove after a 30-day grace period post multi-tenant cutover.
      {
        source: "/app/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: "/app",
        destination: "/",
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
