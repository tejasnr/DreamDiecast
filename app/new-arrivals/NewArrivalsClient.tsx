'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductPage from '@/components/ProductPage';
import { Loader2 } from 'lucide-react';

export default function NewArrivalsClient() {
  const { products, loading } = useProducts();
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const newProducts = products.filter(p => {
    const createdAt = p.createdAt
      ? (typeof p.createdAt === 'number' ? p.createdAt : new Date(String(p.createdAt)).getTime())
      : 0;
    return createdAt > Date.now() - TWO_WEEKS_MS;
  });

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
