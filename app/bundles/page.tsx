import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/JsonLd';
import BundlesClient from './BundlesClient';

export const metadata: Metadata = {
  title: 'Diecast Collector Bundles',
  description:
    'Save with exclusive diecast bundle deals. Curated sets of premium 1/64 scale models at special prices from DreamDiecast India.',
  alternates: { canonical: '/bundles' },
};

export default function BundlesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Bundles', url: `${SITE_URL}/bundles` },
        ]}
      />
      <CollectionPageJsonLd
        name="Diecast Collector Bundles"
        description="Save with curated diecast model bundles and multi-pack deals at DreamDiecast India."
        url={`${SITE_URL}/bundles`}
      />
      <BundlesClient />
    </>
  );
}
