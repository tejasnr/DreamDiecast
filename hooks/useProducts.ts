'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Product } from '@/lib/data';

export function useProducts() {
  const data = useQuery(api.products.list);

  const products: Product[] = (data ?? []).map((p: any) => ({
    id: p.id ?? p._id,
    name: p.name,
    price: p.price,
    image: p.image,
    category: p.category,
    brand: p.brand,
    scale: p.scale,
    description: p.description,
    stock: p.stock,
    rating: p.rating,
    details: p.details ? {
      material: p.details.material ?? '',
      features: p.details.features ?? [],
    } : undefined,
    reviews: p.reviews?.map((r: any) => ({
      user: r.user,
      rating: r.rating,
      comment: r.comment,
      date: '',
    })),
    createdAt: p._creationTime,
  }));

  return {
    products,
    loading: data === undefined,
  };
}
