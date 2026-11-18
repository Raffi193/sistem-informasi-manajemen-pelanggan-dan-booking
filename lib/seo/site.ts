import type { Metadata } from "next";

const fallbackSiteUrl = "https://lpkcvfathan.vercel.app";
const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (vercelProductionUrl
    ? `https://${vercelProductionUrl.replace(/^https?:\/\//, "")}`
    : fallbackSiteUrl);

/** URL kanonis tanpa trailing slash. */
export const SITE_URL = (
  /^https?:\/\//i.test(configuredSiteUrl)
    ? configuredSiteUrl
    : `https://${configuredSiteUrl}`
).replace(/\/+$/, "");

export const SITE_NAME = "LPK CV. Fathan";
export const SITE_ALTERNATE_NAME = "Fathan Driving School";
export const SITE_TITLE =
  "Kursus Mengemudi Palembang Manual & Matic | LPK CV. Fathan";
export const SITE_DESCRIPTION =
  "Kursus mengemudi manual & matic di Palembang bersama LPK CV. Fathan. Instruktur bersertifikat, jadwal fleksibel, kelas malam, dan booking online.";

export const SITE_PHONE = "+6282182944995";
export const SITE_PHONE_DISPLAY = "0821-8294-4995";
export const SITE_WHATSAPP_URL = "https://wa.me/6282182944995";
export const SITE_MAPS_URL = "https://maps.app.goo.gl/sGxegFiEczvHDA4w8";

export const SITE_LOGO_PATH = "/logo-lpk-fathan.jpg";
export const SITE_OG_IMAGE_PATH = "/og-image.jpg";
export const SITE_OG_IMAGE_ALT =
  "LPK CV. Fathan — kursus mengemudi manual dan matic di Palembang";

export const SITE_ADDRESS = {
  streetAddress: "Jl. Gub H. Bastari, 8 Ulu, Kecamatan Seberang Ulu I",
  addressLocality: "Palembang",
  addressRegion: "Sumatera Selatan",
  postalCode: "30111",
  addressCountry: "ID",
} as const;

export const SITE_GEO = {
  latitude: -1.5990784,
  longitude: 102.301696,
} as const;

export const SITE_KEYWORDS = [
  "kursus mengemudi Palembang",
  "kursus mobil manual Palembang",
  "kursus mobil matic Palembang",
  "les mengemudi Palembang",
  "driving school Palembang",
  "LPK CV. Fathan",
];

export const IS_VERCEL_PREVIEW = process.env.VERCEL_ENV === "preview";

export const DEFAULT_ROBOTS: Metadata["robots"] = IS_VERCEL_PREVIEW
  ? { index: false, follow: false }
  : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    };
