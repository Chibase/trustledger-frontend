type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Native script tag for Schema.org JSON-LD (Next.js recommended pattern). */
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload.length === 1 ? payload[0] : payload).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}
