import type { MetadataRoute } from "next";

/**
 * /robots.txt — allows all crawlers, points to sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/vendor/dashboard"],
    },
    sitemap: "https://findmybites.com/sitemap.xml",
  };
}
