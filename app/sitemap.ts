import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

// Sitemap cukup memakai tanggal build; daftar URL-nya statis.
const LAST_MODIFIED = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/booking`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
