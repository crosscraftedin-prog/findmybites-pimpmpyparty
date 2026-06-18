import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel manages the build output automatically — do NOT set `output:
   * "standalone"` here, it's only for self-hosted/Docker deployments and
   * conflicts with Vercel's build pipeline. */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    /* allow remote images if you later point at a CDN; local /uploads and
     * /vendors already work via the public folder. */
    remotePatterns: [],
  },
};

export default nextConfig;
