'use client';

import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { Product } from '@/lib/data';

export default function ProductGrid() {
  const { products, loading } = useProducts();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTimestamp = (val: any) => {
      if (!val) return 0;
      if (typeof val.toDate === 'function') return val.toDate().getTime();
      if (val instanceof Date) return val.getTime();
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return new Date(val).getTime();
      return 0;
    };

    return products
      .filter(product => {
        // Category Filter
        if (activeFilter !== 'All') {
          if (activeFilter === 'In Stock') {
            if (product.category !== 'In Stock' && product.category !== 'Current Stock') return false;
          } else if (product.category !== activeFilter) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        // 3. Sort by latest added
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      });
  }, [products, activeFilter]);

  if (loading) {
    return (
      <div className="py-24 bg-[#050505] flex justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-24 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight mb-2">
              Featured <span className="text-accent">Models</span>
            </h2>
            <p className="text-white/40 text-xs md:text-sm uppercase tracking-widest">
              Handpicked selection of our finest diecast cars
            </p>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-4 md:pb-0 no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
            {['All', 'Pre-Order', 'In Stock', 'New Arrival'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-1 transition-all whitespace-nowrap ${
                  activeFilter === filter 
                    ? 'border-accent text-accent' 
                    : 'border-white/10 text-white/60 hover:border-white hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={setSelectedProduct}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-white/5 bg-white/[0.02]">
            <p className="text-white/20 uppercase tracking-[0.3em] text-xs">No recent arrivals in this category</p>
          </div>
        )}

        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
        
        <div className="mt-16 flex justify-center">
          <button className="border border-white/10 hover:border-white px-12 py-4 font-display font-bold uppercase tracking-widest transition-all">
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
}
