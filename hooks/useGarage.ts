'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { Id } from '@/convex/_generated/dataModel';

export interface GarageItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  brand: string;
  scale: string;
  purchasedAt: string;
  status: 'owned' | 'pre-ordered' | 'arrived';
}

export function useGarage() {
  const { user } = useAuth();
  const data = useQuery(
    api.garage.byUser,
    user ? { userId: user.convexUserId as Id<"users"> } : "skip"
  );

  const items: GarageItem[] = (data ?? []).map((item) => ({
    id: item._id,
    productId: item.productId,
    name: item.name,
    price: item.price,
    originalPrice: item.originalPrice,
    image: item.image,
    category: item.category,
    brand: item.brand,
    scale: item.scale,
    purchasedAt: new Date(item.purchasedAt).toISOString(),
    status: item.status,
  }));

  return {
    items,
    loading: data === undefined,
  };
}
