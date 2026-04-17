import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/JsonLd';
import NewArrivalsClient from './NewArrivalsClient';

export const metadata: Metadata = {
  title: 'New Diecast Arrivals',
  description:
    'Shop the latest diecast car arrivals at DreamDiecast. New 1/64 scale models from Hot Wheels, Mini GT, Tarmac Works, Pop Race and more.',
  alternates: { canonical: '/new-arrivals' },
};

export default function NewArrivalsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'New Arrivals', url: `${SITE_URL}/new-arrivals` },
        ]}
      />
      <CollectionPageJsonLd
        name="New Diecast Arrivals"
        description="The latest diecast models just added to DreamDiecast. New drops from Hot Wheels, Mini GT, Tarmac Works and more."
        url={`${SITE_URL}/new-arrivals`}
      />
      <NewArrivalsClient />
    </>
  );
}
