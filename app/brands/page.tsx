'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { BRANDS } from '@/lib/brands';
import BrandCard from '@/components/BrandCard';

export default function BrandsPage() {
  const counts = useQuery(api.products.getCountByBrand);

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-[2px] bg-accent" />
          <span className="text-accent text-[10px] uppercase tracking-[0.4em] font-mono">Brands</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-3">
          Shop by Brand
        </h1>
        <p className="text-white/40 text-xs md:text-sm uppercase tracking-widest max-w-2xl">
          Explore our curated selection of diecast manufacturers. Each brand tells a different story.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BRANDS.map((brand, index) => {
            const count = counts ? counts[brand.name] ?? 0 : undefined;
            return (
              <BrandCard
                key={brand.slug}
                brand={brand}
                count={count}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
