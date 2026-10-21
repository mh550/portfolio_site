import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // .harness/check.sh builds into .next-check so it never clobbers the dev server's .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    qualities: [75, 100],
  },
  // D79: /approach folded into /about's How I work section (P1-05); permanent → 308
  async redirects() {
    return [{ source: '/approach', destination: '/about#how-i-work', permanent: true }];
  },
};

export default nextConfig;
