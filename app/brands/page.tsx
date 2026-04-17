import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/JsonLd';
import BrandsClient from './BrandsClient';

export const metadata: Metadata = {
  title: 'Shop Diecast Cars by Brand',
  description:
    'Explore diecast cars by brand. Shop Hot Wheels, Mini GT, Tarmac Works, Pop Race, Bburago & Matchbox 1/64 scale models at DreamDiecast India.',
  alternates: { canonical: '/brands' },
};

export default function BrandsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Shop by Brand', url: `${SITE_URL}/brands` },
        ]}
      />
      <CollectionPageJsonLd
        name="Shop Diecast Cars by Brand"
        description="Explore diecast models by brand. Hot Wheels, Mini GT, Tarmac Works, Pop Race, Bburago, Matchbox and more."
        url={`${SITE_URL}/brands`}
      />
      <BrandsClient />
    </>
  );
}
