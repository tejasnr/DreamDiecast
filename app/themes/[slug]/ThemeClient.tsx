'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductPage from '@/components/ProductPage';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const THEME_MAP: Record<string, { category: string; title: string; subtitle: string }> = {
  'jdm-legends': { category: 'JDM Legends', title: 'JDM Legends', subtitle: 'Skylines \u00b7 Supras \u00b7 NSXs' },
  'exotics-hypercars': { category: 'Exotics & Hypercars', title: 'Exotics & Hypercars', subtitle: 'Lamborghini \u00b7 Ferrari \u00b7 Bugatti' },
  'motorsport-track-day': { category: 'Motorsport', title: 'Motorsport / Track Day', subtitle: 'Le Mans \u00b7 F1 \u00b7 DTM' },
};

export default function ThemeClient() {
  const params = useParams();
  const slug = params.slug as string;
  const { products, loading } = useProducts();

  const theme = THEME_MAP[slug];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-4">Theme Not Found</h1>
        <p className="text-white/40 max-w-md mb-8 uppercase tracking-widest text-xs">The theme you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="bg-white text-black px-8 py-4 font-display font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  const themeProducts = products.filter(p => p.category === theme.category);

  return (
    <ProductPage
      title={theme.title}
      subtitle={theme.subtitle}
      products={themeProducts}
    />
  );
}
