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
  category: 'Pre-Order' | 'In Stock' | 'New Arrival' | 'Bundle' | 'Current Stock';
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
}

export const products: Product[] = [];
