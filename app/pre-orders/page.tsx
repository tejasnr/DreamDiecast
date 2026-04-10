'use client';

import { useProducts } from '@/hooks/useProducts';
import ProductPage from '@/components/ProductPage';
import { Loader2 } from 'lucide-react';

export default function PreOrdersPage() {
  const { products, loading } = useProducts();
  const preOrderProducts = products.filter(
    p => (p.listingType === 'pre-order' || p.category === 'Pre-Order' || p.isPreorder === true)
      && p.status !== 'unlisted'
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <ProductPage
      title="The Vault"
      subtitle="Upcoming Releases"
      products={preOrderProducts}
      bannerImage="https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=1920&auto=format&fit=crop"
    />
  );
}
