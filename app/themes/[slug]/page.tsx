import type { Metadata } from 'next';
import { SITE_URL, THEME_SEO } from '@/lib/seo';
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/JsonLd';
import ThemeClient from './ThemeClient';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = THEME_SEO[slug];

  if (!seo) {
    return { title: 'Theme Not Found' };
  }

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: `${seo.title} | DreamDiecast`,
      description: seo.description,
      url: `${SITE_URL}/themes/${slug}`,
    },
    alternates: { canonical: `/themes/${slug}` },
  };
}

export function generateStaticParams() {
  return Object.keys(THEME_SEO).map((slug) => ({ slug }));
}

export default async function ThemePage({ params }: Props) {
  const { slug } = await params;
  const seo = THEME_SEO[slug];

  const displayName = seo?.title || slug.replace(/-/g, ' ');

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: displayName, url: `${SITE_URL}/themes/${slug}` },
        ]}
      />
      <CollectionPageJsonLd
        name={displayName}
        description={seo?.description || `${displayName} diecast models at DreamDiecast India.`}
        url={`${SITE_URL}/themes/${slug}`}
      />
      <ThemeClient />
    </>
  );
}
