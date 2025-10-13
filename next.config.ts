import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/app", // your environment's mount path
  assetPrefix: "/app", // ensure this matches your environment's mount path
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
