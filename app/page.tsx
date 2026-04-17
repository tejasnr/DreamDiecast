import HomeClient from './HomeClient';
import { JsonLd } from '@/components/JsonLd';
import { SITE_URL } from '@/lib/seo';

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: 'DreamDiecast',
          description:
            "DreamDiecast is India's premier online store for premium diecast car collectibles. Based in Bangalore, India, we stock 1:64, 1:43, and 1:24 scale models from brands including Hot Wheels, Mini GT, Tarmac Works, Bburago, Pop Race, and Matchbox. We ship across India with secure collector-grade packaging.",
          url: SITE_URL,
          image: `${SITE_URL}/og-image.png`,
          priceRange: '₹₹',
          currenciesAccepted: 'INR',
          paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Bangalore',
            addressRegion: 'Karnataka',
            addressCountry: 'IN',
          },
        }}
      />
      <HomeClient />
    </>
  );
}
