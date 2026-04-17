export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'DreamDiecast',
        url: 'https://dreamdiecast.in',
        logo: 'https://dreamdiecast.in/logo.png',
        description:
          "India's premier destination for premium 1/64 scale diecast car collectibles",
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-91487-24708',
          email: 'dreamdiecast@gmail.com',
          contactType: 'customer service',
          availableLanguage: ['English', 'Hindi'],
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Bangalore',
          addressRegion: 'Karnataka',
          addressCountry: 'IN',
        },
        sameAs: [
          'https://www.instagram.com/dreamdiecastofficial/',
          'https://chat.whatsapp.com/BvgtaCooKYpJpsfDo978Fy',
        ],
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'DreamDiecast',
        url: 'https://dreamdiecast.in',
        description: 'Premium diecast car collectibles in India.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://dreamdiecast.in/products?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function CollectionPageJsonLd({
  name,
  description,
  url,
  numberOfItems,
}: {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        description,
        url,
        ...(numberOfItems !== undefined && { numberOfItems }),
        provider: {
          '@type': 'Organization',
          name: 'DreamDiecast',
        },
      }}
    />
  );
}

export function FAQJsonLd({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }}
    />
  );
}
