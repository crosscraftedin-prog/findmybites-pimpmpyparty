import type { MetadataRoute } from "next";

/**
 * /robots.txt — allows all crawlers, points to sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/dashboard",
        "/account",
        "/vendor/dashboard",
        "/activate/",
        "/claim-token/",
        "/auth/callback",
      ],
    },
    sitemap: "https://www.findmybites.com/sitemap.xml",
  };
}
