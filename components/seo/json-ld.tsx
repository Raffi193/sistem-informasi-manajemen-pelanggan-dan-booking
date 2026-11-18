type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

/**
 * Menyisipkan JSON-LD dengan escaping `<` agar aman dari injeksi tag script.
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
