import type { FaqItem } from "@/lib/content/faq";
import type { PaketPublik } from "@/lib/data/paket";
import {
  SITE_ADDRESS,
  SITE_ALTERNATE_NAME,
  SITE_DESCRIPTION,
  SITE_GEO,
  SITE_LOGO_PATH,
  SITE_MAPS_URL,
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  SITE_PHONE,
  SITE_TITLE,
  SITE_URL,
} from "./site";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const WEBPAGE_ID = `${SITE_URL}/#webpage`;
const COURSE_ID = `${SITE_URL}/#course`;

function labelTransmisi(transmisi: string) {
  if (transmisi === "kombinasi") return "manual dan matic";
  if (transmisi === "matic") return "matic";
  return "manual";
}

function absoluteUrl(path: string) {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export function organizationSchema(paketList: PaketPublik[]) {
  const prices = paketList.map((paket) => paket.harga);
  const priceRange =
    prices.length > 0
      ? `Rp${Math.min(...prices).toLocaleString("id-ID")} - Rp${Math.max(...prices).toLocaleString("id-ID")}`
      : null;
  const catalog =
    paketList.length > 0
      ? {
          "@type": "OfferCatalog",
          name: "Paket kursus mengemudi",
          itemListElement: paketList.map((paket) => ({
            "@type": "Offer",
            name: paket.nama,
            price: paket.harga,
            priceCurrency: "IDR",
            category: "Paid",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/booking?paket=${paket.id}`,
            itemOffered: {
              "@type": "Service",
              name: paket.nama,
              serviceType: "Kursus mengemudi mobil",
              description: `${paket.jumlah_pertemuan} pertemuan kursus mengemudi ${labelTransmisi(paket.transmisi)} di Palembang.`,
              provider: { "@id": ORGANIZATION_ID },
              areaServed: { "@type": "City", name: "Palembang" },
            },
          })),
        }
      : null;

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "EducationalOrganization"],
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}${SITE_LOGO_PATH}`,
      width: 512,
      height: 512,
    },
    image: {
      "@type": "ImageObject",
      url: `${SITE_URL}${SITE_OG_IMAGE_PATH}`,
      width: 1200,
      height: 630,
    },
    description: SITE_DESCRIPTION,
    slogan: "Belajar mengemudi jadi lebih mudah",
    knowsAbout: [
      "kursus mengemudi",
      "mengemudi mobil manual",
      "mengemudi mobil matic",
      "keselamatan berkendara",
    ],
    telephone: SITE_PHONE,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_PHONE,
      contactType: "customer service",
      areaServed: "ID",
      availableLanguage: ["id"],
    },
    address: {
      "@type": "PostalAddress",
      ...SITE_ADDRESS,
    },
    geo: {
      "@type": "GeoCoordinates",
      ...SITE_GEO,
    },
    areaServed: [
      { "@type": "City", name: "Palembang" },
      { "@type": "AdministrativeArea", name: "Sumatera Selatan" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "20:00",
      },
    ],
    currenciesAccepted: "IDR",
    paymentAccepted: "Cash, QRIS, Bank Transfer",
    ...(priceRange ? { priceRange } : {}),
    sameAs: [SITE_MAPS_URL],
    hasMap: SITE_MAPS_URL,
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/booking`,
        inLanguage: "id-ID",
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
    },
    ...(catalog ? { hasOfferCatalog: catalog } : {}),
  };
}

export function courseSchema(paketList: PaketPublik[]) {
  const offers = paketList.map((paket) => ({
    "@type": "Offer",
    name: paket.nama,
    price: paket.harga,
    priceCurrency: "IDR",
    category: "Paid",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/booking?paket=${paket.id}`,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": COURSE_ID,
    name: "Kursus Mengemudi Mobil Manual & Matic di Palembang",
    url: `${SITE_URL}/booking`,
    description:
      "Kursus mengemudi mobil manual dan matic untuk pemula di Palembang, dengan instruktur bersertifikat dan jadwal fleksibel.",
    provider: { "@id": ORGANIZATION_ID },
    inLanguage: "id-ID",
    teaches: [
      "Mengemudi mobil manual",
      "Mengemudi mobil matic",
      "Keselamatan berkendara",
    ],
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "onsite",
      inLanguage: "id-ID",
      location: {
        "@type": "Place",
        name: SITE_NAME,
        address: {
          "@type": "PostalAddress",
          ...SITE_ADDRESS,
        },
      },
    },
    ...(offers.length > 0 ? { offers } : {}),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "id-ID",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function webPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": WEBPAGE_ID,
    url: SITE_URL,
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    mainEntity: { "@id": COURSE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${SITE_URL}${SITE_OG_IMAGE_PATH}`,
      width: 1200,
      height: 630,
    },
    inLanguage: "id-ID",
  };
}

export function faqPageSchema(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    url: SITE_URL,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "id-ID",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function breadcrumbSchema(
  items: readonly { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
