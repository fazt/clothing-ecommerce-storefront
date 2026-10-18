import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5226";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/checkout", "/api"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
