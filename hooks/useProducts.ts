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
    listingType: p.listingType,
    status: p.status,
    isPreorder: p.isPreorder,
    images: p.images,
    sku: p.sku,
    condition: p.condition,
    type: p.type,
    specialFeatures: p.specialFeatures,
    bookingAdvance: p.bookingAdvance,
    totalFinalPrice: p.totalFinalPrice,
    eta: p.eta,
  }));

  return {
    products,
    loading: data === undefined,
  };
}
