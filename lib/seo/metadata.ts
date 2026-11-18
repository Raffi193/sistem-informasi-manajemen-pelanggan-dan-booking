import type { Metadata } from "next";
import {
  DEFAULT_ROBOTS,
  SITE_NAME,
  SITE_OG_IMAGE_ALT,
  SITE_OG_IMAGE_PATH,
  SITE_URL,
} from "./site";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

/**
 * Metadata halaman turunan. Judul pendek di sini akan otomatis mendapat
 * template brand dari root layout, sementara Open Graph memakai judul penuh.
 */
export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: SITE_OG_IMAGE_PATH,
          type: "image/jpeg",
          width: 1200,
          height: 630,
          alt: SITE_OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [SITE_OG_IMAGE_PATH],
    },
    robots: noIndex ? { index: false, follow: false } : DEFAULT_ROBOTS,
  };
}
