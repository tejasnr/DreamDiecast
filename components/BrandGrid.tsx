'use client';

import { BRANDS } from '@/lib/brands';
import BrandCard from '@/components/BrandCard';

export default function BrandGrid() {
  return (
    <section className="py-24 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col gap-3 mb-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-white/30" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/50">SHOP BY BRAND</span>
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest">Browse our collection by manufacturer</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BRANDS.map((brand, index) => (
            <BrandCard
              key={brand.slug}
              brand={brand}
              variant="compact"
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
