import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import '@/app/globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Providers from './providers';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/JsonLd';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: {
    default: 'DreamDiecast | Premium 1/64 Diecast Collectibles',
    template: '%s | DreamDiecast',
  },
  description:
    "India's premier destination for premium 1/64 scale diecast models. Shop Hot Wheels, Mini GT, Tarmac Works, Pop Race, Bburago & Matchbox.",
  metadataBase: new URL('https://dreamdiecast.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dreamdiecast.in',
    siteName: 'DreamDiecast',
    title: 'DreamDiecast | Premium 1/64 Diecast Collectibles',
    description:
      "India's premier destination for premium 1/64 scale diecast models. Shop Hot Wheels, Mini GT, Tarmac Works, Pop Race, Bburago & Matchbox.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DreamDiecast - Premium Diecast Collectibles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DreamDiecast | Premium 1/64 Diecast Collectibles',
    description:
      "India's premier destination for premium 1/64 scale diecast models.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://dreamdiecast.in',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

// Set to true to show maintenance page, false to go back to normal
const MAINTENANCE_MODE = true;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://convex.cloud" />
        <link rel="preconnect" href="https://cdn.convex.cloud" />
        <link rel="dns-prefetch" href="https://convex.cloud" />
        <link rel="dns-prefetch" href="https://cdn.convex.cloud" />
      </head>
      <body className="bg-[#050505] text-white antialiased" suppressHydrationWarning>
        {MAINTENANCE_MODE ? (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-display)] mb-4">
              Under Maintenance
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-md">
              We&apos;re working on something awesome. We&apos;ll be back shortly!
            </p>
            <div className="mt-8 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
          </div>
        ) : (
          <>
            <OrganizationJsonLd />
            <WebSiteJsonLd />
            <Providers>
              <Navbar />
              {children}
              <Footer />
              <Analytics />
              <SpeedInsights />
            </Providers>
          </>
        )}
      </body>
    </html>
  );
}
