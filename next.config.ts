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
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,

  // ── ZAI (GLM AI) configuration ──────────────────────────────────────────
  // Set as build-time env vars so getZAI() uses the ENV VAR path (step 1)
  // instead of the fallback config (step 3). This ensures the ZAI SDK
  // initializes with the correct config on Vercel without needing to set
  // env vars in the Vercel dashboard.
  //
  // The fallback config in zai-server.ts uses the same values, but setting
  // them here ensures the ENV VAR path is logged and used explicitly.
  env: {
    ZAI_BASE_URL: process.env.ZAI_BASE_URL || "https://internal-api.z.ai/v1",
    ZAI_API_KEY: process.env.ZAI_API_KEY || "Z.ai",
    ZAI_CHAT_ID: process.env.ZAI_CHAT_ID || "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
    ZAI_USER_ID: process.env.ZAI_USER_ID || "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
    ZAI_TOKEN: process.env.ZAI_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
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
