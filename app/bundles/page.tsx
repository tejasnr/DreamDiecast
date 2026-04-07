'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductPage from '@/components/ProductPage';
import { Loader2 } from 'lucide-react';

export default function BundlesPage() {
  const { products, loading } = useProducts();
  const bundleProducts = products.filter(p => p.category === 'Bundle');
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <ProductPage
      title="Collector Sets"
      subtitle="Exclusive Bundles"
      products={bundleProducts}
      bannerImage="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1920&auto=format&fit=crop"
    />
  );
}
