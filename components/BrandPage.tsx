'use client';

import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Brand } from '@/lib/brands';
import { Product } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BRAND_SEO, THEME_SEO } from '@/lib/seo';

interface BrandPageProps {
  brand: Brand;
}

const FILTERS = ['All', 'In Stock', 'Pre-Order', 'New Arrival', 'Bundle'] as const;

type FilterKey = typeof FILTERS[number];

export default function BrandPage({ brand }: BrandPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const data = useQuery(api.products.getByBrand, { brand: brand.name });

  const products = useMemo((): Product[] => {
    return (data ?? []).map((p: any) => ({
      id: p.id ?? p._id,
      name: p.name,
      price: p.price,
      image: p.image ?? '',
      images: p.images,
      category: p.category as Product['category'],
      brand: p.brand,
      scale: p.scale,
      description: p.description,
      stock: p.stock,
      rating: p.rating,
      details: p.details ? {
        type: p.details.type ?? '',
        features: p.details.features ?? [],
      } : undefined,
      reviews: p.reviews?.map((r: any) => ({
        user: r.user,
        rating: r.rating,
        comment: r.comment,
        date: '',
      })),
      createdAt: p._creationTime,
      sku: p.sku,
      condition: p.condition,
      material: p.material,
      specialFeatures: p.specialFeatures,
      listingType: p.listingType,
      status: p.status,
      isPreorder: p.isPreorder,
      bookingAdvance: p.bookingAdvance,
      totalFinalPrice: p.totalFinalPrice,
      eta: p.eta,
    }));
  }, [data]);

  const visibleProducts = useMemo(
    () => products.filter((p) => p.status !== 'unlisted'),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'All') return visibleProducts;

    if (activeFilter === 'In Stock') {
      return visibleProducts.filter((p) => {
        const isPO = p.listingType === 'pre-order' || p.category === 'Pre-Order' || p.isPreorder === true;
        return !isPO;
      });
    }

    if (activeFilter === 'Pre-Order') {
      return visibleProducts.filter((p) =>
        p.listingType === 'pre-order'
        || p.category === 'Pre-Order'
        || p.isPreorder === true
      );
    }

    if (activeFilter === 'New Arrival') {
      const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
      return visibleProducts.filter((p) => {
        const createdAt = typeof p.createdAt === 'number' ? p.createdAt : 0;
        return createdAt > twoWeeksAgo;
      });
    }

    return visibleProducts.filter((p) => p.category === activeFilter);
  }, [visibleProducts, activeFilter]);

  const isLoading = data === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  const seo = BRAND_SEO[brand.slug];
  const relatedThemes = seo?.relatedThemes ?? [];

  return (
    <main className="min-h-screen bg-[#050505] pb-24" style={{ ['--brand-accent' as string]: brand.accentColor }}>
      <Breadcrumbs items={[
        { name: 'Home', href: '/' },
        { name: 'Brands', href: '/brands' },
        { name: brand.name },
      ]} />

      <div className="relative mb-12 md:mb-16 overflow-hidden">
        <div className="absolute inset-0 carbon-pattern opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-10 md:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start gap-6"
          >
            <Image
              src={brand.logo}
              alt={`${brand.name} diecast model cars — official brand logo`}
              width={160}
              height={80}
              className="object-contain"
              priority
            />
            <div>
              <div className="flex items-center space-x-3 mb-3 md:mb-4">
                <span className="w-8 md:w-12 h-[2px] bg-[color:var(--brand-accent)]" />
                <span className="text-[color:var(--brand-accent)] font-mono text-[10px] md:text-xs tracking-[0.4em] uppercase">
                  {brand.tagline}
                </span>
              </div>
              <h1 className="text-4xl md:text-7xl font-display font-bold uppercase tracking-tighter">
                {brand.name}
              </h1>
              <p className="text-white/50 text-xs md:text-sm uppercase tracking-widest mt-3 max-w-2xl">
                {brand.description}
              </p>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />
      </div>

      {seo?.intro && (
        <article className="max-w-7xl mx-auto px-6 mb-12">
          <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-3xl">
            {seo.intro}
          </p>
        </article>
      )}

      <div className="max-w-7xl mx-auto px-6">
        <aside aria-label="Product filters" className="flex flex-wrap gap-3 mb-10">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all rounded-sm ${
                activeFilter === filter
                  ? 'bg-[color:var(--brand-accent)] text-black border-transparent'
                  : 'border-white/10 text-white/60 hover:border-white/40 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </aside>

        {visibleProducts.length === 0 ? (
          <div className="text-center py-24 border border-white/5 carbon-pattern">
            <p className="text-white/40 uppercase tracking-widest font-mono mb-6">No models available yet. Check back soon.</p>
            <Link href="/brands" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:gap-4 transition-all">
              Back to Brands
            </Link>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-white/5 bg-white/[0.02]">
            <p className="text-white/40 uppercase tracking-widest font-mono">No {activeFilter} items for {brand.name} right now.</p>
          </div>
        )}
      </div>

      {relatedThemes.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mt-20 pt-12 border-t border-white/5">
          <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-white/40 mb-6">
            Explore Related Collections
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedThemes.map((themeSlug) => {
              const theme = THEME_SEO[themeSlug];
              if (!theme) return null;
              return (
                <Link
                  key={themeSlug}
                  href={`/themes/${themeSlug}`}
                  className="px-5 py-3 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-[0.15em] hover:border-white/30 hover:text-white transition-all"
                >
                  {theme.title}
                </Link>
              );
            })}
            <Link
              href="/brands"
              className="px-5 py-3 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-[0.15em] hover:border-white/30 hover:text-white transition-all"
            >
              All Brands
            </Link>
          </div>
        </section>
      )}

    </main>
  );
}
