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
    material: string;
    features: string[];
  };
  createdAt?: number;
  // New fields
  sku?: string;
  condition?: string;
  material?: string;
  specialFeatures?: string;
  listingType?: string;
  status?: string;
  isPreorder?: boolean;
  bookingAdvance?: number;
  totalFinalPrice?: number;
  eta?: string;
}

export const products: Product[] = [];
