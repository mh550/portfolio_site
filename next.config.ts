import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // .harness/check.sh builds into .next-check so it never clobbers the dev server's .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    qualities: [75, 100],
  },
};

export default nextConfig;
