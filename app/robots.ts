import type { MetadataRoute } from "next";
import { IS_VERCEL_PREVIEW, SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  if (IS_VERCEL_PREVIEW) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /status dan /login sengaja tetap bisa dirayapi agar meta noindex-nya
        // terbaca. /admin dan /api tidak perlu dirayapi.
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
