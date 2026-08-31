import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nothing custom needed for Step 1.
};

export default nextConfig;

// Enable the Cloudflare bindings during `next dev` when using the
// OpenNext adapter. Guarded so a plain `next dev` still works.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
