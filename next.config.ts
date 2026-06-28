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
    /* Allow remote images from Supabase Storage (vendor uploads) and
     * Unsplash (placeholder/seed imagery). Local /uploads and /vendors
     * already work via the public folder. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
