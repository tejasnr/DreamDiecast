'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductPage from '@/components/ProductPage';
import { Loader2 } from 'lucide-react';

export default function ProductsPage() {
  const { products, loading } = useProducts();
  const listedProducts = products.filter((product) => product.status !== 'unlisted');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <ProductPage
      title="All Models"
      subtitle="Available Inventory"
      products={listedProducts}
      bannerImage="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920&auto=format&fit=crop"
    />
  );
}
