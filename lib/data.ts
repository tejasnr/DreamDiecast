export interface Review {
  user: string;
  comment: string;
  rating: number;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  brand: string;
  scale: string;
  description?: string;
  stock?: number;
  rating?: number;
  reviews?: Review[];
  details?: {
    type: string;
    features: string[];
  };
  createdAt?: number;
  // New fields
  sku?: string;
  condition?: string;
  type?: string;
  specialFeatures?: string;
  listingType?: string;
  status?: string;
  isPreorder?: boolean;
  bookingAdvance?: number;
  totalFinalPrice?: number;
  eta?: string;
  isHype?: boolean;
}

/** Check if a product or cart item is a pre-order (works with any object that has these optional fields) */
export function isPreOrderItem(item: { category?: string; listingType?: string; isPreorder?: boolean }): boolean {
  return item.listingType === 'pre-order' || item.category === 'Pre-Order' || item.isPreorder === true;
}

export const products: Product[] = [];
