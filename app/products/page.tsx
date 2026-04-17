import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/JsonLd';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'All Diecast Models',
  description:
    'Browse our complete collection of premium 1/64 scale diecast models. Hot Wheels, Mini GT, Tarmac Works, Pop Race, Bburago & Matchbox available in India.',
  alternates: { canonical: '/products' },
};

export default function ProductsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'All Diecast Models', url: `${SITE_URL}/products` },
        ]}
      />
      <CollectionPageJsonLd
        name="All Diecast Models"
        description="Browse our complete collection of premium 1/64 scale diecast models from top brands worldwide."
        url={`${SITE_URL}/products`}
      />
      <ProductsClient />
    </>
  );
}
