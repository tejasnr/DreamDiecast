'use client';

import { useParams, notFound } from 'next/navigation';
import { getBrandBySlug } from '@/lib/brands';
import BrandPage from '@/components/BrandPage';

export default function BrandDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const brand = getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  return <BrandPage brand={brand} />;
}
