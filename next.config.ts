import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/app", // your environment's mount path
  assetPrefix: "/app", // ensure this matches your environment's mount path
  async redirects() {
    return [
      {
        source: "/",
        destination: "/app",
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
