'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductPage from '@/components/ProductPage';
import { Loader2 } from 'lucide-react';

export default function CurrentStockPage() {
  const { products, loading } = useProducts();
  const stockProducts = products.filter(p => p.category === 'Current Stock' || p.category === 'In Stock');
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <ProductPage
      title="In Stock"
      subtitle="Ready for Delivery"
      products={stockProducts}
      bannerImage="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920&auto=format&fit=crop"
    />
  );
}
