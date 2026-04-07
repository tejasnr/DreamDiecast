'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductPage from '@/components/ProductPage';
import { Loader2 } from 'lucide-react';

export default function NewArrivalsPage() {
  const { products, loading } = useProducts();
  const newProducts = products.filter(p => p.category === 'New Arrival');
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <ProductPage
      title="Fresh Drops"
      subtitle="Just Landed"
      products={newProducts}
      bannerImage="https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1920&auto=format&fit=crop"
    />
  );
}
