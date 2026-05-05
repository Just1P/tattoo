import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/feed", "/artists"],
        disallow: ["/dashboard", "/admin", "/api", "/onboarding"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
