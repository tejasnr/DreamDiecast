import type { Metadata } from 'next';
import { BRANDS } from '@/lib/brands';
import { SITE_URL, BRAND_SEO } from '@/lib/seo';
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/JsonLd';
import BrandDetailClient from './BrandDetailClient';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  const seo = BRAND_SEO[slug];

  if (!brand) {
    return { title: 'Brand Not Found' };
  }

  const title = seo?.title || `${brand.name} Diecast Models`;
  const description = seo?.description || `Shop ${brand.name} 1/64 scale diecast models at DreamDiecast India. ${brand.description} Browse our ${brand.name} collection with secure shipping across India.`;

  return {
    title,
    description,
    keywords: seo?.keywords,
    openGraph: {
      title: `${title} | DreamDiecast`,
      description,
      url: `${SITE_URL}/brands/${slug}`,
      images: brand.logo ? [{ url: brand.logo, alt: brand.name }] : undefined,
    },
    alternates: { canonical: `/brands/${slug}` },
  };
}

export function generateStaticParams() {
  return BRANDS.map((brand) => ({ slug: brand.slug }));
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  const seo = BRAND_SEO[slug];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Brands', url: `${SITE_URL}/brands` },
          { name: brand?.name || slug, url: `${SITE_URL}/brands/${slug}` },
        ]}
      />
      <CollectionPageJsonLd
        name={seo?.title || `${brand?.name || slug} Diecast Models`}
        description={seo?.description || `Shop ${brand?.name || slug} diecast models at DreamDiecast India.`}
        url={`${SITE_URL}/brands/${slug}`}
      />
      <BrandDetailClient />
    </>
  );
}
