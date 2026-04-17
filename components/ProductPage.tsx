'use client';

import { useEffect } from 'react';
import { Product } from '@/lib/data';
import ProductCard from './ProductCard';
import { motion } from 'motion/react';
import Image from 'next/image';
import { trackEvent } from '@/lib/posthog';

interface ProductPageProps {
  title: string;
  subtitle: string;
  products: Product[];
  bannerImage?: string;
}

export default function ProductPage({ title, subtitle, products, bannerImage }: ProductPageProps) {
  useEffect(() => {
    trackEvent('category_viewed', { category: title, productCount: products.length });
  }, [title, products.length]);

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-24">
      {/* Page Header */}
      <div className="relative h-[30vh] md:h-[40vh] mb-12 md:mb-16 overflow-hidden">
        {bannerImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={bannerImage}
              alt={title}
              fill
              className="object-cover opacity-30 grayscale"
              priority
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-8 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-3 md:mb-4">
              <span className="w-8 md:w-12 h-[2px] bg-accent" />
              <span className="text-accent font-mono text-[10px] md:text-xs tracking-[0.4em] uppercase">
                {subtitle}
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-display font-bold uppercase tracking-tighter">
              {title}
            </h1>
          </motion.div>
        </div>
        <div className="absolute inset-0 tire-tread opacity-5 pointer-events-none" />
      </div>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-6" aria-label="Product listings">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-white/5 carbon-pattern">
            <p className="text-white/40 uppercase tracking-widest font-mono">No models found in this category.</p>
          </div>
        )}
      </section>

    </main>
  );
}
