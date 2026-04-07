'use client';

import { Inter, Space_Grotesk } from 'next/font/google';
import '@/app/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import PostHogProvider from '@/components/PostHogProvider';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <title>DreamDiecast | Premium Diecast Collectibles</title>
        <meta name="description" content="Elevate your collection with exclusive diecast models from Pagani, Toyota, BMW and more." />
      </head>
      <body className="bg-[#050505] text-white antialiased">
        <ConvexProvider client={convex}>
          <PostHogProvider>
            <AuthProvider>
              <CartProvider>
                <Navbar />
                {children}
                <Footer />
              </CartProvider>
            </AuthProvider>
          </PostHogProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
