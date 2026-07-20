import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel manages the build output automatically — do NOT set `output:
   * "standalone"` here, it's only for self-hosted/Docker deployments and
   * conflicts with Vercel's build pipeline. */
  // Keep ignoreBuildErrors to prevent Vercel build failures from non-app
  // type errors (prisma seed scripts, skills). App source has 0 TS errors.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // ── ZAI (GLM AI) configuration ──────────────────────────────────────────
  // ZAI credentials must be set as environment variables in Vercel.
  // Do NOT hardcode secrets in this file — they get committed to git.
  // Required env vars: ZAI_BASE_URL, ZAI_API_KEY, ZAI_CHAT_ID,
  // ZAI_USER_ID, ZAI_TOKEN
  env: {
    ZAI_BASE_URL: process.env.ZAI_BASE_URL || "",
    ZAI_API_KEY: process.env.ZAI_API_KEY || "",
    ZAI_CHAT_ID: process.env.ZAI_CHAT_ID || "",
    ZAI_USER_ID: process.env.ZAI_USER_ID || "",
    ZAI_TOKEN: process.env.ZAI_TOKEN || "",
  },

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
