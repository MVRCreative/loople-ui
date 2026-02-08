import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/app", // your environment's mount path
  assetPrefix: "/app", // ensure this matches your environment's mount path
  async rewrites() {
    // basePath: false requires absolute destination; use env or default for dev
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return [
      {
        source: "/",
        destination: `${base}/app`,
        basePath: false,
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
    ],
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
