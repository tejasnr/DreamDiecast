'use client';

import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import PostHogProvider from '@/components/PostHogProvider';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <PostHogProvider>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </PostHogProvider>
    </ConvexProvider>
  );
}
