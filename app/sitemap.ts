import type { MetadataRoute } from "next";
import {
  SITE_LOGO_PATH,
  SITE_OG_IMAGE_PATH,
  SITE_URL,
} from "@/lib/seo/site";

// Sitemap cukup memakai tanggal build; daftar URL-nya statis.
const LAST_MODIFIED = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
      images: [
        `${SITE_URL}${SITE_OG_IMAGE_PATH}`,
        `${SITE_URL}${SITE_LOGO_PATH}`,
      ],
    },
    {
      url: `${SITE_URL}/booking`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
