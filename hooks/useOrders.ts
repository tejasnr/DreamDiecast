'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { Id } from '@/convex/_generated/dataModel';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  scale: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal?: number;
  shippingCharges?: number;
  totalAmount: number;
  transaction_id: string;
  payment_proof_url: string;
  payment_method: string;
  payment_status: 'submitted' | 'verified' | 'rejected';
  order_status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  shipping_details?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: { toDate: () => Date } | string | Date;
}

export function useOrders() {
  const { user } = useAuth();
  const data = useQuery(
    api.orders.byUser,
    user ? { userId: user.convexUserId as Id<"users"> } : "skip"
  );

  const orders: Order[] = (data ?? []).map((o: any) => ({
    id: o._id,
    userId: o.userId,
    userEmail: o.userEmail,
    items: o.items.map((item: any) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      brand: item.brand,
      scale: item.scale,
      quantity: item.quantity,
    })),
    subtotal: o.subtotal,
    shippingCharges: o.shippingCharges,
    totalAmount: o.totalAmount,
    transaction_id: o.transactionId,
    payment_proof_url: o.paymentProofUrl,
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    order_status: o.orderStatus,
    shipping_details: o.shippingDetails,
    createdAt: new Date(o._creationTime),
  }));

  return {
    orders,
    loading: data === undefined,
  };
}
