'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Product } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import { BRANDS } from '@/lib/brands';
import { Loader2, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

const ORDER_FILTERS = ['All', 'In Stock', 'Pre-Order'] as const;
type OrderFilter = typeof ORDER_FILTERS[number];

export default function OtherBrandsPage() {
  const [activeBrand, setActiveBrand] = useState<string>('All');
  const [activeOrderFilter, setActiveOrderFilter] = useState<OrderFilter>('All');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  const data = useQuery(api.products.list);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setBrandDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const brandNames = useQuery(api.products.getOtherBrandNames);

  // Build full brand list: main brands + other brands
  const allBrandOptions = useMemo(() => {
    const mainNames = BRANDS.map((b) => b.name);
    const otherNames = brandNames ?? [];
    // Deduplicate: main brands first, then others not already in main
    const combined = [...mainNames];
    for (const name of otherNames) {
      if (!combined.includes(name)) {
        combined.push(name);
      }
    }
    return combined;
  }, [brandNames]);

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
      createdAt: p._creationTime,
      sku: p.sku,
      condition: p.condition,
      specialFeatures: p.specialFeatures,
      listingType: p.listingType,
      status: p.status,
      isPreorder: p.isPreorder,
      bookingAdvance: p.bookingAdvance,
      totalFinalPrice: p.totalFinalPrice,
      eta: p.eta,
    }));
  }, [data]);

  const MAIN_BRAND_NAMES = BRANDS.map((b) => b.name);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeBrand !== 'All') {
      result = result.filter((p) => p.brand === activeBrand);
    } else {
      // Default "All" shows only non-main brands (the "other" brands)
      result = result.filter((p) => !MAIN_BRAND_NAMES.includes(p.brand));
    }

    if (activeOrderFilter === 'In Stock') {
      result = result.filter((p) => {
        const isPO = p.listingType === 'pre-order' || p.category === 'Pre-Order' || p.isPreorder === true;
        return !isPO;
      });
    } else if (activeOrderFilter === 'Pre-Order') {
      result = result.filter((p) =>
        p.listingType === 'pre-order'
        || p.category === 'Pre-Order'
        || p.isPreorder === true
      );
    }

    return result;
  }, [products, activeBrand, activeOrderFilter]);

  const isLoading = data === undefined || brandNames === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-24">
      <div className="relative mb-12 md:mb-16 overflow-hidden">
        <div className="absolute inset-0 carbon-pattern opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-10 md:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start gap-6"
          >
            <div>
              <div className="flex items-center space-x-3 mb-3 md:mb-4">
                <span className="w-8 md:w-12 h-[2px] bg-white/40" />
                <span className="text-white/60 font-mono text-[10px] md:text-xs tracking-[0.4em] uppercase">
                  More Brands
                </span>
              </div>
              <h1 className="text-4xl md:text-7xl font-display font-bold uppercase tracking-tighter">
                Other Brands
              </h1>
              <p className="text-white/50 text-xs md:text-sm uppercase tracking-widest mt-3 max-w-2xl">
                Explore our collection from additional manufacturers and brands.
              </p>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Brand Dropdown */}
        <div className="mb-6">
          <p className="text-white/30 text-[10px] font-mono uppercase tracking-[0.3em] mb-3">Brand</p>
          <div ref={brandDropdownRef} className="relative w-full max-w-xs">
            <button
              type="button"
              onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-left focus:border-accent outline-none transition-colors flex items-center justify-between"
            >
              <span className={activeBrand === 'All' ? 'text-white/40' : 'text-white'}>
                {activeBrand === 'All' ? 'All Brands' : activeBrand}
              </span>
              <ChevronDown
                size={14}
                className={`text-white/40 transition-transform ${brandDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {brandDropdownOpen && (
              <ul className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-sm shadow-xl">
                <li
                  onMouseDown={() => {
                    setActiveBrand('All');
                    setBrandDropdownOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    activeBrand === 'All'
                      ? 'bg-accent/20 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  All Brands
                </li>
                {allBrandOptions.map((name) => (
                  <li
                    key={name}
                    onMouseDown={() => {
                      setActiveBrand(name);
                      setBrandDropdownOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      activeBrand === name
                        ? 'bg-accent/20 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Order/PO Filters */}
        <div className="mb-10">
          <p className="text-white/30 text-[10px] font-mono uppercase tracking-[0.3em] mb-3">Order Type</p>
          <div className="flex flex-wrap gap-3">
            {ORDER_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveOrderFilter(filter)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all rounded-sm ${
                  activeOrderFilter === filter
                    ? 'bg-white text-black border-transparent'
                    : 'border-white/10 text-white/60 hover:border-white/40 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 border border-white/5 carbon-pattern">
            <p className="text-white/40 uppercase tracking-widest font-mono mb-6">No products from other brands yet. Check back soon.</p>
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
            <p className="text-white/40 uppercase tracking-widest font-mono">
              No {activeOrderFilter !== 'All' ? activeOrderFilter.toLowerCase() : ''} items
              {activeBrand !== 'All' ? ` for ${activeBrand}` : ''} right now.
            </p>
          </div>
        )}
      </div>

    </main>
  );
}
