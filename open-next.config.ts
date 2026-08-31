import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Default incremental cache. Swap in R2/KV-backed caching later if needed.
});
