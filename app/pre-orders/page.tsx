import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/JsonLd';
import PreOrdersClient from './PreOrdersClient';

export const metadata: Metadata = {
  title: 'Pre-Order Upcoming Diecast Models',
  description:
    'Reserve upcoming diecast releases before they sell out. Pre-order the latest 1/64 scale models from top brands at DreamDiecast India.',
  alternates: { canonical: '/pre-orders' },
};

export default function PreOrdersPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Pre-Orders', url: `${SITE_URL}/pre-orders` },
        ]}
      />
      <CollectionPageJsonLd
        name="Pre-Order Upcoming Diecast Models"
        description="Reserve upcoming diecast releases before they sell out. Secure limited edition models at DreamDiecast India."
        url={`${SITE_URL}/pre-orders`}
      />
      <PreOrdersClient />
    </>
  );
}
