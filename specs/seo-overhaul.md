# SEO Overhaul — DreamDiecast

> Based on [claude-seo](https://github.com/AgriciDaniel/claude-seo) methodology & tooling
> Scoring: Content 23% | Technical SEO 22% | On-Page 20% | Schema 10% | Performance 10% | GEO 10% | Images 5%

---

## 0. Tool Setup — claude-seo

### What It Is
claude-seo is a Claude Code skill that provides 20+ SEO sub-skills covering technical audits, on-page analysis, E-E-A-T content quality, schema markup, GEO (AI search optimization), and more. It runs parallel subagents to audit your site across all SEO dimensions.

### Installation (run once)

```bash
# Option A: Plugin install (Claude Code 1.0.33+)
/plugin marketplace add AgriciDaniel/claude-seo
/plugin install claude-seo@AgriciDaniel-claude-seo

# Option B: Manual install (macOS/Linux)
git clone --depth 1 https://github.com/AgriciDaniel/claude-seo.git
bash claude-seo/install.sh

# Option C: One-liner
curl -fsSL https://raw.githubusercontent.com/AgriciDaniel/claude-seo/main/install.sh | bash
```

### Key Commands to Use Per Phase

| Command | When to Use | Phase |
|---------|-------------|-------|
| `/seo audit <url>` | Full site audit — run before Phase 1 to get baseline score | Pre-work |
| `/seo technical <url>` | Validate robots.txt, sitemap, crawlability after Phase 1 | 1 |
| `/seo page <url>` | Check individual page metadata after Phase 2 | 2 |
| `/seo schema <url>` | Validate JSON-LD after Phase 3 | 3 |
| `/seo content <url>` | E-E-A-T and content quality check after Phase 4 | 4 |
| `/seo geo <url>` | AI search optimization check after Phase 5 | 5 |
| `/seo images <url>` | Image alt text and optimization audit after Phase 6 | 6 |
| `/seo ecommerce <url>` | E-commerce-specific SEO audit (product pages, pricing schema) | 5-6 |
| `/seo drift baseline <url>` | Capture baseline after each phase to track progress | All |
| `/seo drift compare <url>` | Compare current vs previous baseline | All |
| `/seo sitemap generate` | Generate optimized sitemap with e-commerce templates | 1 |

### Workflow Per Phase
```
1. Run `/seo drift baseline <url>` before starting the phase
2. Implement all changes for the phase
3. Deploy to preview/production
4. Run the phase-specific `/seo` command to validate
5. Run `/seo drift compare <url>` to measure improvement
6. Fix any flagged issues before moving to next phase
```

---

## 1. Current State (Score: ~5/100)

| Area | Weight | Current Score | Issue |
|------|--------|---------------|-------|
| Content Quality | 23% | 10 | No descriptive content on listing pages, no FAQ, no blog |
| Technical SEO | 22% | 0 | No robots.txt, no sitemap, no crawl directives |
| On-Page SEO | 20% | 5 | Hardcoded `<title>` in layout, no per-page metadata |
| Schema/Structured Data | 10% | 0 | No JSON-LD, no schema.org markup whatsoever |
| Performance | 10% | 60 | Vercel + Next.js is decent, but all pages are CSR |
| GEO (AI Search) | 10% | 0 | No AI bot rules, no citable content, no entity signals |
| Images | 5% | 20 | Next.js Image component used but no alt text strategy |
| **Weighted Total** | | **~12** | |

### Critical Blockers
- `app/layout.tsx` uses `'use client'` — **blocks the entire Next.js Metadata API**
- Every page is a Client Component — zero SSR SEO benefit
- No `robots.txt` — search engines have no crawl guidance
- No `sitemap.xml` — no URL discovery for crawlers
- No structured data — Google can't understand products/brand/org
- No AI bot access rules — invisible to ChatGPT, Perplexity, Claude searches

---

## 2. Phase Plan Overview

| Phase | Focus | Score Target | Complexity |
|-------|-------|-------------|------------|
| **Phase 1** | Technical Foundation | 5 -> 25 | Low |
| **Phase 2** | On-Page Metadata | 25 -> 38 | Low |
| **Phase 3** | Structured Data (Schema) | 38 -> 48 | Medium |
| **Phase 4** | Content & E-E-A-T | 48 -> 55 | Medium |
| **Phase 5** | GEO + AI Search Optimization | 55 -> 60 | Medium |
| **Phase 6** | Images + Performance Polish | 60 -> 65 | Low-Medium |

**Target after all 6 phases: 60-65/100** (up from ~12)

> Higher scores (70+) require a content/blog strategy and individual product detail pages — those are Phase 7+ territory.

---

## 3. Phase 1 — Technical Foundation

**Goal:** Make the site crawlable and discoverable. Biggest single jump in score.
**Score impact:** Technical SEO 0 -> 70 (+15.4 weighted points)
**Validate with:** `/seo technical https://dreamdiecast.in`

### 1.1 Refactor Root Layout to Server Component

**Problem:** `app/layout.tsx` is `'use client'`, blocking `metadata` exports entirely.

**Solution:** Split into server layout + client providers wrapper.

```
app/
├── layout.tsx              <- Server Component (metadata lives here)
├── providers.tsx            <- NEW: Client Component wrapping all providers
```

**`app/layout.tsx`** (Server Component — NO `'use client'`):
```tsx
import { Inter, Space_Grotesk } from 'next/font/google';
import '@/app/globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

const SITE_URL = 'https://dreamdiecast.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DreamDiecast | Premium Diecast Collectibles India',
    template: '%s | DreamDiecast',
  },
  description:
    "India's premier destination for premium diecast car collectibles. Hot Wheels, Mini GT, Tarmac Works, Bburago, Pop Race & Matchbox scale models.",
  keywords: [
    'diecast cars',
    'diecast collectibles India',
    'Hot Wheels India',
    'Mini GT',
    'Tarmac Works',
    'scale models',
    '1:64 diecast',
    'premium diecast',
    'buy diecast cars online India',
    'diecast model cars',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'DreamDiecast',
    title: 'DreamDiecast | Premium Diecast Collectibles India',
    description:
      "India's premier destination for premium diecast car collectibles from top brands worldwide.",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DreamDiecast — Premium Diecast Collectibles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DreamDiecast | Premium Diecast Collectibles India',
    description:
      "India's premier destination for premium diecast car collectibles.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body
        className="bg-[#050505] text-white antialiased"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**`app/providers.tsx`** (Client Component):
```tsx
'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import PostHogProvider from '@/components/PostHogProvider';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <PostHogProvider>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            {children}
            <Footer />
            <Analytics />
            <SpeedInsights />
          </CartProvider>
        </AuthProvider>
      </PostHogProvider>
    </ConvexProvider>
  );
}
```

### 1.2 Create `app/robots.ts`

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/checkout/',
          '/garage/',
          '/api/',
          '/pay/',
          '/order-success/',
        ],
      },
      // AI bot access — critical for GEO
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
    ],
    sitemap: 'https://dreamdiecast.in/sitemap.xml',
  };
}
```

### 1.3 Create `app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next';
import { BRANDS } from '@/lib/brands';

const THEME_SLUGS = ['jdm-legends', 'exotics-hypercars', 'motorsport-track-day'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dreamdiecast.in';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/pre-orders`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/new-arrivals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/bundles`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/returns`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/shipping-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const brandPages: MetadataRoute.Sitemap = BRANDS.map((brand) => ({
    url: `${baseUrl}/brands/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const themePages: MetadataRoute.Sitemap = THEME_SLUGS.map((slug) => ({
    url: `${baseUrl}/themes/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...brandPages, ...themePages];
}
```

> **Note:** Sitemap is static (no Convex queries at build time). Avoids Convex free-tier limits. Product-level URLs added when individual product pages are built (Phase 7+).

### 1.4 Create `lib/seo.ts` — Shared SEO Constants

```ts
export const SITE_URL = 'https://dreamdiecast.in';
export const SITE_NAME = 'DreamDiecast';
export const DEFAULT_OG_IMAGE = '/og-image.jpg';

export const BRAND_SEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  hotwheels: {
    title: 'Hot Wheels Diecast Cars',
    description:
      'Shop Hot Wheels diecast models in India. Premium 1:64 scale collectibles, limited editions, and exclusive releases at DreamDiecast.',
    keywords: ['Hot Wheels India', 'Hot Wheels diecast', 'Hot Wheels collectibles', 'buy Hot Wheels online'],
  },
  bburago: {
    title: 'Bburago Diecast Models',
    description:
      'Italian-crafted Bburago diecast models. Premium scale replicas of Ferrari, Lamborghini, and more. Shop at DreamDiecast India.',
    keywords: ['Bburago India', 'Bburago diecast', 'Bburago Ferrari', 'Bburago Lamborghini'],
  },
  minigt: {
    title: 'Mini GT Diecast Cars',
    description:
      'True Scale Miniatures Mini GT collection. High-detail 1:64 scale diecast models of supercars and JDM legends at DreamDiecast.',
    keywords: ['Mini GT India', 'Mini GT diecast', 'TSM Mini GT', '1:64 Mini GT'],
  },
  poprace: {
    title: 'Pop Race Limited Edition Diecast',
    description:
      'Exclusive Pop Race limited edition diecast models. Hong Kong-based premium collectibles available at DreamDiecast India.',
    keywords: ['Pop Race diecast', 'Pop Race India', 'Pop Race limited edition'],
  },
  tarmacworks: {
    title: 'Tarmac Works Diecast Cars',
    description:
      'Tarmac Works motorsport-inspired diecast. High-detail racing livery models and track legends at DreamDiecast India.',
    keywords: ['Tarmac Works India', 'Tarmac Works diecast', 'Tarmac Works racing'],
  },
  matchbox: {
    title: 'Matchbox Diecast Cars',
    description:
      'Classic Matchbox diecast collectibles. The original pocket-sized scale models since 1953. Shop at DreamDiecast India.',
    keywords: ['Matchbox India', 'Matchbox diecast', 'Matchbox collectibles', 'vintage Matchbox'],
  },
};

export const THEME_SEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  'jdm-legends': {
    title: 'JDM Legends Diecast Collection',
    description:
      'Japanese Domestic Market legends in miniature. Nissan Skyline GT-R, Toyota Supra, Honda NSX diecast models at DreamDiecast.',
    keywords: ['JDM diecast', 'Skyline GT-R diecast', 'Toyota Supra diecast', 'Honda NSX model'],
  },
  'exotics-hypercars': {
    title: 'Exotic & Hypercar Diecast Models',
    description:
      "Lamborghini, Ferrari, Bugatti and more. Premium diecast replicas of the world's most exotic supercars at DreamDiecast.",
    keywords: ['supercar diecast', 'Lamborghini diecast', 'Ferrari model car', 'hypercar collectibles'],
  },
  'motorsport-track-day': {
    title: 'Motorsport & Track Day Diecast',
    description:
      'Le Mans, F1, DTM racing diecast models. Authentic motorsport liveries and track-ready replicas at DreamDiecast India.',
    keywords: ['racing diecast', 'F1 model cars', 'Le Mans diecast', 'motorsport collectibles'],
  },
};
```

### Phase 1 Checklist
- [ ] Refactor `layout.tsx` to Server Component
- [ ] Create `providers.tsx` with all client providers
- [ ] Create `app/robots.ts`
- [ ] Create `app/sitemap.ts`
- [ ] Create `lib/seo.ts`
- [ ] Verify all existing functionality (cart, auth, checkout, admin) works unchanged
- [ ] Run `/seo technical https://dreamdiecast.in` to validate
- [ ] Run `/seo drift baseline https://dreamdiecast.in` to capture post-Phase-1 state

### Phase 1 Score Estimate

| Area | Before | After | Change |
|------|--------|-------|--------|
| Technical SEO | 0 | 70 | +70 |
| On-Page SEO | 5 | 25 | +20 |
| **Weighted impact** | | | **+~19 points** |
| **Running total** | **~12** | **~25** | |

---

## 4. Phase 2 — On-Page Metadata (Every Page Gets a Title & Description)

**Goal:** Every public page has unique `<title>`, `<meta description>`, OG tags, and canonical URL.
**Score impact:** On-Page 25 -> 75 (+10 weighted points)
**Validate with:** `/seo page https://dreamdiecast.in/products` (run per page)

### 2.1 Static Page Metadata

For pages that are `'use client'`, create a `layout.tsx` in the same route segment to export metadata (since client components can't export metadata).

| Page | Route | Title | Description |
|------|-------|-------|-------------|
| Products | `/products` | `All Diecast Models — In Stock` | Browse all available diecast car models. Hot Wheels, Mini GT, Tarmac Works, Bburago & more at DreamDiecast India. |
| Brands | `/brands` | `Shop by Brand` | Browse diecast models by brand. Hot Wheels, Mini GT, Tarmac Works, Pop Race, Bburago, Matchbox at DreamDiecast. |
| Pre-Orders | `/pre-orders` | `Pre-Orders — Upcoming Diecast Releases` | Reserve upcoming diecast models before they drop. Secure limited edition releases at DreamDiecast India. |
| New Arrivals | `/new-arrivals` | `New Arrivals — Latest Diecast Models` | Just dropped — the latest diecast models added to DreamDiecast. New Hot Wheels, Mini GT, and more. |
| Bundles | `/bundles` | `Bundle Deals — Diecast Collections` | Save with curated diecast model bundles and multi-pack deals at DreamDiecast India. |
| About | `/about` | `About DreamDiecast` | India's premier diecast collectible store. Learn about our mission, brands, and community. |
| Privacy | `/privacy` | `Privacy Policy` | robots: noindex |
| Returns | `/returns` | `Returns & Exchange Policy` | robots: noindex |
| Shipping | `/shipping-policy` | `Shipping Policy` | robots: noindex |

**Pattern for `'use client'` pages — add a `layout.tsx`:**

Example: `app/products/layout.tsx`
```tsx
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'All Diecast Models — In Stock',
  description:
    'Browse all available diecast car models. Hot Wheels, Mini GT, Tarmac Works, Bburago & more at DreamDiecast India.',
  openGraph: {
    title: 'All Diecast Models — In Stock | DreamDiecast',
    description:
      'Browse all available diecast car models from top brands worldwide.',
    url: `${SITE_URL}/products`,
  },
  alternates: { canonical: `${SITE_URL}/products` },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Repeat this pattern for: `/brands`, `/pre-orders`, `/new-arrivals`, `/bundles`, `/about`.

### 2.2 Dynamic Page Metadata (`generateMetadata`)

**`app/brands/[slug]/layout.tsx`:**
```tsx
import type { Metadata } from 'next';
import { getBrandBySlug } from '@/lib/brands';
import { BRAND_SEO, SITE_URL } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  const seo = BRAND_SEO[slug];

  if (!brand || !seo) return {};

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: `${seo.title} | DreamDiecast`,
      description: seo.description,
      url: `${SITE_URL}/brands/${slug}`,
      images: brand.logo ? [{ url: brand.logo, alt: brand.name }] : undefined,
    },
    alternates: { canonical: `${SITE_URL}/brands/${slug}` },
  };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**`app/themes/[slug]/layout.tsx`:**
```tsx
import type { Metadata } from 'next';
import { THEME_SEO, SITE_URL } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seo = THEME_SEO[slug];

  if (!seo) return {};

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: `${seo.title} | DreamDiecast`,
      description: seo.description,
      url: `${SITE_URL}/themes/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/themes/${slug}` },
  };
}

export default function ThemeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### 2.3 noindex Layouts for Private Routes

Create `layout.tsx` with `robots: { index: false, follow: false }` for:
- `app/admin/layout.tsx`
- `app/checkout/layout.tsx`
- `app/garage/layout.tsx`
- `app/pay/layout.tsx`
- `app/order-success/layout.tsx`

```tsx
// Example: app/admin/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### Phase 2 Checklist
- [ ] Create `layout.tsx` with metadata for: `/products`, `/brands`, `/pre-orders`, `/new-arrivals`, `/bundles`, `/about`
- [ ] Create `layout.tsx` with `generateMetadata` for: `/brands/[slug]`, `/themes/[slug]`
- [ ] Create noindex `layout.tsx` for: `/admin`, `/checkout`, `/garage`, `/pay`, `/order-success`
- [ ] Add noindex metadata for `/privacy`, `/returns`, `/shipping-policy`
- [ ] Run `/seo page <url>` on 3-4 key pages to validate
- [ ] Verify no duplicate `<title>` tags across pages

### Phase 2 Score Estimate

| Area | Before | After | Change |
|------|--------|-------|--------|
| On-Page SEO | 25 | 75 | +50 |
| Technical SEO | 70 | 80 | +10 |
| **Weighted impact** | | | **+~12 points** |
| **Running total** | **~25** | **~38** | |

---

## 5. Phase 3 — Structured Data (JSON-LD Schema)

**Goal:** Help Google (and AI engines) understand what DreamDiecast is, what it sells, and how its pages relate.
**Score impact:** Schema 0 -> 75 (+7.5 weighted points)
**Validate with:** `/seo schema https://dreamdiecast.in`

### 3.1 Create `components/seo/JsonLd.tsx`

```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'DreamDiecast',
        url: 'https://dreamdiecast.in',
        logo: 'https://dreamdiecast.in/logo.png',
        description:
          "India's premier destination for premium diecast car collectibles.",
        sameAs: [
          'https://www.instagram.com/dreamdiecastofficial/',
          'https://chat.whatsapp.com/BvgtaCooKYpJpsfDo978Fy',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['English', 'Hindi'],
        },
      }}
    />
  );
}

export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'DreamDiecast',
        url: 'https://dreamdiecast.in',
        description: 'Premium diecast car collectibles in India.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://dreamdiecast.in/products?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function CollectionPageSchema({
  name,
  description,
  url,
  numberOfItems,
}: {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        description,
        url,
        ...(numberOfItems !== undefined && { numberOfItems }),
        provider: {
          '@type': 'Organization',
          name: 'DreamDiecast',
        },
      }}
    />
  );
}

export function ProductSchema({
  name,
  description,
  image,
  brand,
  sku,
  price,
  currency = 'INR',
  availability,
  url,
}: {
  name: string;
  description: string;
  image: string;
  brand: string;
  sku: string;
  price: number;
  currency?: string;
  availability: 'InStock' | 'PreOrder' | 'OutOfStock';
  url: string;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        image,
        brand: { '@type': 'Brand', name: brand },
        sku,
        offers: {
          '@type': 'Offer',
          price,
          priceCurrency: currency,
          availability: `https://schema.org/${availability}`,
          url,
          seller: { '@type': 'Organization', name: 'DreamDiecast' },
        },
      }}
    />
  );
}
```

### 3.2 Where to Inject Schemas

| Schema | Page | How |
|--------|------|-----|
| `OrganizationSchema` | Root layout (`app/layout.tsx`) | Add as child of `<body>` |
| `WebSiteSchema` | Home page (`app/page.tsx`) | Add inside page component |
| `BreadcrumbSchema` | All brand/theme pages | Add in `layout.tsx` for each route |
| `CollectionPageSchema` | `/products`, `/brands/[slug]`, `/themes/[slug]` | Add in layout or page |
| `ProductSchema` | Product detail (when built) | Future — Phase 7+ |

**Example — Root layout with Organization schema:**
```tsx
// In app/layout.tsx, inside <body>:
<body>
  <OrganizationSchema />
  <Providers>{children}</Providers>
</body>
```

**Example — Brand page breadcrumbs in `app/brands/[slug]/layout.tsx`:**
```tsx
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/seo/JsonLd';
import { BRAND_SEO, SITE_URL } from '@/lib/seo';

export default function BrandLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const seo = BRAND_SEO[params.slug];
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Brands', url: `${SITE_URL}/brands` },
          { name: seo?.title || params.slug, url: `${SITE_URL}/brands/${params.slug}` },
        ]}
      />
      {seo && (
        <CollectionPageSchema
          name={seo.title}
          description={seo.description}
          url={`${SITE_URL}/brands/${params.slug}`}
        />
      )}
      {children}
    </>
  );
}
```

### Phase 3 Checklist
- [ ] Create `components/seo/JsonLd.tsx` with all schema components
- [ ] Add `OrganizationSchema` to root layout
- [ ] Add `WebSiteSchema` + `SearchAction` to home page
- [ ] Add `BreadcrumbSchema` to all brand and theme pages
- [ ] Add `CollectionPageSchema` to `/products`, `/brands/[slug]`, `/themes/[slug]`
- [ ] Validate with Google Rich Results Test (https://search.google.com/test/rich-results)
- [ ] Run `/seo schema https://dreamdiecast.in` to audit

### Phase 3 Score Estimate

| Area | Before | After | Change |
|------|--------|-------|--------|
| Schema/Structured Data | 0 | 75 | +75 |
| **Weighted impact** | | | **+~7.5 points** |
| **Running total** | **~38** | **~48** | |

---

## 6. Phase 4 — Content & E-E-A-T Signals

**Goal:** Add citable, descriptive content to key pages so search engines (and AI) understand what the site offers. This is what makes people searching "buy Hot Wheels diecast India" find DreamDiecast.
**Score impact:** Content 10 -> 40 (+6.9 weighted), GEO partial boost
**Validate with:** `/seo content https://dreamdiecast.in`

### 4.1 Add Intro Content Blocks to Listing Pages

Currently, listing pages are just product grids with no text. Search engines and AI need text content to understand and rank pages.

**Add a descriptive H1 + intro paragraph to each listing page:**

| Page | H1 | Intro (80-150 words) |
|------|-----|----------------------|
| `/products` | `Premium Diecast Collectibles` | A paragraph about the full catalog — brands carried, scale types, what makes DreamDiecast different |
| `/brands` | `Shop Diecast by Brand` | Brief overview of all brands, what each is known for |
| `/brands/[slug]` | `{Brand Name} Diecast Models` | Brand-specific intro — history, what they're known for, scale types available |
| `/pre-orders` | `Pre-Order Upcoming Diecast Releases` | Explain pre-order process, why pre-order, deposit system |
| `/new-arrivals` | `New Arrivals — Latest Drops` | What's new, how often inventory updates, encourage browsing |
| `/bundles` | `Diecast Bundle Deals` | Value proposition — save with curated bundles |

**Implementation pattern:**
```tsx
// Add ABOVE the product grid in each page component
<section className="max-w-4xl mx-auto px-4 py-8 text-center">
  <h1 className="text-3xl font-bold mb-4">Premium Diecast Collectibles</h1>
  <p className="text-gray-400 text-lg leading-relaxed">
    Explore India's most curated collection of premium diecast models.
    From Hot Wheels and Mini GT to Tarmac Works and Bburago, we carry
    1:64, 1:43, and 1:24 scale collectibles from the world's top brands.
    Whether you're hunting JDM legends, exotic hypercars, or motorsport
    liveries — your next grail piece is here.
  </p>
</section>
```

### 4.2 Proper Heading Hierarchy

Ensure every page follows `h1 > h2 > h3` — no skipping levels, exactly one `h1` per page.

| Element | Current | Fix |
|---------|---------|-----|
| Brand page | No h1, brand name might be h2 or styled div | Add proper `<h1>` |
| Product grid sections | Random heading levels | Use `<h2>` for sections |
| Filter labels | Some use heading tags | Change to `<span>` or `<label>` |

### 4.3 Enrich About Page

The About page should be the most content-rich page — it's the primary E-E-A-T signal.

Add/ensure:
- Clear mission statement
- Founding story (Experience signal)
- Brands carried and why (Expertise signal)
- Shipping and authenticity guarantees (Trust signals)
- Contact information prominently displayed
- Question-based headings: "Why Choose DreamDiecast?", "What Brands Do We Carry?"

### 4.4 Internal Linking

Add contextual links between related pages:
- Brand pages should link to related themes (e.g., Mini GT -> JDM Legends)
- Theme pages should link to relevant brands
- Footer should have links to all major categories
- Breadcrumb navigation visible on brand/theme pages

### Phase 4 Checklist
- [ ] Add H1 + intro paragraph to `/products`, `/brands`, `/pre-orders`, `/new-arrivals`, `/bundles`
- [ ] Add brand-specific intro content to each `/brands/[slug]` page
- [ ] Fix heading hierarchy across all pages (one h1, proper h2/h3 nesting)
- [ ] Enrich About page with E-E-A-T content
- [ ] Add visible breadcrumb navigation to brand/theme pages
- [ ] Add internal cross-links between related categories
- [ ] Run `/seo content https://dreamdiecast.in` to validate

### Phase 4 Score Estimate

| Area | Before | After | Change |
|------|--------|-------|--------|
| Content Quality | 10 | 40 | +30 |
| On-Page SEO | 75 | 80 | +5 |
| **Weighted impact** | | | **+~8 points** |
| **Running total** | **~48** | **~55** | |

---

## 7. Phase 5 — GEO (Generative Engine Optimization) + AI Search

**Goal:** Make DreamDiecast visible in AI-powered searches (ChatGPT, Perplexity, Google AI Overviews). When someone asks an AI "where to buy diecast cars in India", DreamDiecast should be cited.
**Score impact:** GEO 0 -> 70 (+7 weighted points)
**Validate with:** `/seo geo https://dreamdiecast.in`

### 5.1 AI Bot Access (already done in Phase 1)
- `robots.ts` allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended

### 5.2 Citable Content Blocks

AI search engines cite self-contained, factual content blocks. Add these to key pages:

**Home page — "What is DreamDiecast?" block:**
```
DreamDiecast is India's premier online store for premium diecast car
collectibles. Based in India, we stock 1:64, 1:43, and 1:24 scale models
from brands including Hot Wheels, Mini GT, Tarmac Works, Bburago, Pop Race,
and Matchbox. We ship across India with secure packaging for collectors.
```

**About page — self-contained answer blocks** (150-200 words each):
- "What brands does DreamDiecast carry?"
- "How does DreamDiecast ship diecast models?"
- "What is DreamDiecast's return policy?"
- "Are DreamDiecast products authentic?"

**Brand pages — brand-specific Q&A style content:**
- "What Hot Wheels models are available at DreamDiecast?"
- "What scale are Mini GT diecast cars?"

### 5.3 Entity Consistency

Ensure "DreamDiecast" is used consistently as the brand name across:
- All metadata titles
- Organization schema `name`
- Open Graph `siteName`
- Content headings
- Footer copyright

### 5.4 Semantic HTML for AI Parsing

- Use `<article>` for content blocks
- Use `<nav>` for breadcrumbs
- Use `<main>` for primary content area
- Use `<aside>` for filters/sidebar
- Use `<header>` and `<footer>` semantically

### 5.5 FAQ Schema for Key Pages

Add `FAQPage` JSON-LD to About page and potentially brand pages:

```tsx
export function FAQSchema({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }}
    />
  );
}
```

> Note: Google restricted FAQ rich results in Aug 2023 to government/health sites, but the schema still helps AI engines parse and cite your content.

### Phase 5 Checklist
- [ ] Add citable content blocks to home page and about page
- [ ] Add brand-specific Q&A content to brand pages
- [ ] Ensure "DreamDiecast" entity consistency across all pages
- [ ] Add semantic HTML elements (`<article>`, `<nav>`, `<main>`, `<aside>`)
- [ ] Add FAQ schema to About page
- [ ] Run `/seo geo https://dreamdiecast.in` to validate
- [ ] Run `/seo ecommerce https://dreamdiecast.in` for e-commerce specific checks

### Phase 5 Score Estimate

| Area | Before | After | Change |
|------|--------|-------|--------|
| GEO (AI Search) | 0 | 70 | +70 |
| Content Quality | 40 | 45 | +5 |
| **Weighted impact** | | | **+~8 points** |
| **Running total** | **~55** | **~60** | |

---

## 8. Phase 6 — Images + Performance Polish

**Goal:** Optimize images for SEO (alt text, sizing, formats) and squeeze out remaining performance points.
**Score impact:** Images 20 -> 60 (+2 weighted), Performance 60 -> 70 (+1 weighted)
**Validate with:** `/seo images https://dreamdiecast.in`

### 6.1 Image Alt Text Strategy

Every product image needs descriptive alt text. Pattern:
```
alt="{Brand} {Model Name} {Scale} Diecast Model Car"
```

Examples:
- `"Hot Wheels Nissan Skyline GT-R R34 1:64 Diecast Model Car"`
- `"Mini GT Lamborghini Huracán STO 1:64 Diecast Collectible"`
- `"Tarmac Works Toyota GR Supra Racing Livery 1:64 Scale Model"`

**Implementation:**
- Update `ProductCard.tsx` to generate alt text from product data
- Update `ProductDetailModal.tsx` image alt text
- Update `BrandCard.tsx` with brand-specific alt text

### 6.2 Create OG Image

**`public/og-image.jpg`** — 1200x630px
- DreamDiecast logo
- Tagline: "Premium Diecast Collectibles"
- Dark background (#050505)
- 1-2 hero product images
- Used as default fallback for all Open Graph/Twitter cards

### 6.3 Image Sizing & Format

- Ensure all `<Image>` components have explicit `width` and `height` (prevents CLS)
- Use `priority` prop on above-the-fold hero images
- Verify Next.js image optimization is working (WebP/AVIF auto-conversion)

### 6.4 Performance Quick Wins

- Add `loading="lazy"` to below-fold images (Next.js `<Image>` does this by default)
- Verify `next/font` is loading fonts optimally (already using `Inter` + `Space_Grotesk`)
- Check for unnecessary client-side JavaScript in pages that could be server components
- Add `<link rel="preconnect">` for Convex and image CDN domains

### Phase 6 Checklist
- [ ] Update `ProductCard.tsx` with descriptive alt text pattern
- [ ] Update `ProductDetailModal.tsx` image alt text
- [ ] Update `BrandCard.tsx` with brand alt text
- [ ] Create `public/og-image.jpg` (1200x630)
- [ ] Ensure all `<Image>` components have width/height
- [ ] Add `priority` to hero images
- [ ] Run `/seo images https://dreamdiecast.in` to validate
- [ ] Run Lighthouse SEO audit — target score >= 90

### Phase 6 Score Estimate

| Area | Before | After | Change |
|------|--------|-------|--------|
| Images | 20 | 60 | +40 |
| Performance | 60 | 70 | +10 |
| **Weighted impact** | | | **+~3 points** |
| **Running total** | **~60** | **~65** | |

---

## 9. File Structure Summary

### New Files
```
app/providers.tsx                       <- Client provider wrapper (Phase 1)
app/robots.ts                           <- Crawl rules + AI bot access (Phase 1)
app/sitemap.ts                          <- URL index for crawlers (Phase 1)
lib/seo.ts                              <- SEO constants & per-page data (Phase 1)
app/products/layout.tsx                 <- Products page metadata (Phase 2)
app/brands/layout.tsx                   <- Brands index metadata (Phase 2)
app/brands/[slug]/layout.tsx            <- Dynamic brand metadata + schema (Phase 2-3)
app/themes/[slug]/layout.tsx            <- Dynamic theme metadata + schema (Phase 2-3)
app/pre-orders/layout.tsx               <- Pre-orders metadata (Phase 2)
app/new-arrivals/layout.tsx             <- New arrivals metadata (Phase 2)
app/bundles/layout.tsx                  <- Bundles metadata (Phase 2)
app/about/layout.tsx                    <- About metadata (Phase 2)
app/admin/layout.tsx                    <- noindex (Phase 2)
app/checkout/layout.tsx                 <- noindex (Phase 2)
app/garage/layout.tsx                   <- noindex (Phase 2)
app/pay/layout.tsx                      <- noindex (Phase 2)
app/order-success/layout.tsx            <- noindex (Phase 2)
components/seo/JsonLd.tsx               <- Reusable JSON-LD components (Phase 3)
public/og-image.jpg                     <- Open Graph image (Phase 6)
```

### Modified Files
```
app/layout.tsx                          <- Convert to Server Component (Phase 1)
app/page.tsx                            <- Add WebSiteSchema + citable content (Phase 3, 5)
app/about/page.tsx                      <- Enrich E-E-A-T content (Phase 4)
app/products/page.tsx                   <- Add H1 + intro content (Phase 4)
app/brands/page.tsx                     <- Add H1 + intro content (Phase 4)
app/brands/[slug]/page.tsx              <- Add brand intro content (Phase 4)
app/pre-orders/page.tsx                 <- Add H1 + intro content (Phase 4)
app/new-arrivals/page.tsx               <- Add H1 + intro content (Phase 4)
app/bundles/page.tsx                    <- Add H1 + intro content (Phase 4)
components/ProductCard.tsx              <- Descriptive alt text (Phase 6)
components/ProductDetailModal.tsx       <- Descriptive alt text (Phase 6)
components/BrandCard.tsx                <- Brand alt text (Phase 6)
```

---

## 10. Edge Cases & Error Handling

| Case | Handling |
|------|----------|
| Unknown brand slug | `generateMetadata` returns `{}` -> falls back to root layout defaults |
| Unknown theme slug | Same fallback behavior |
| Missing OG image | Twitter/OG falls back to site-level default from root layout |
| Crawlers hitting admin/checkout | `robots.txt` disallows + `noindex` meta on layouts |
| Convex free-tier limits | Sitemap is fully static (no DB calls). No build-time Convex queries |
| Vercel build time | All metadata is static or from local constants. No API calls during build |
| Duplicate content (www vs non-www) | Canonical URLs on every page |
| Products without images | Alt text falls back to product name only |
| New brands added | Update `lib/seo.ts` BRAND_SEO map + `lib/brands.ts` |
| New themes added | Update `lib/seo.ts` THEME_SEO map + THEME_SLUGS in sitemap |

---

## 11. Completion Criteria (All Phases)

### Phase 1 — Technical Foundation
- [ ] Root `layout.tsx` is a Server Component with `metadata` export
- [ ] `providers.tsx` wraps all client providers without breaking existing functionality
- [ ] `robots.ts` serves correct crawl directives (verify at `/robots.txt`)
- [ ] `sitemap.ts` generates valid XML (verify at `/sitemap.xml`)

### Phase 2 — On-Page Metadata
- [ ] Every public page has unique `<title>` and `<meta name="description">`
- [ ] Dynamic brand/theme pages generate correct metadata per slug
- [ ] Admin, checkout, garage, pay, order-success routes have `noindex`
- [ ] Open Graph tags render correctly (test with https://www.opengraph.xyz/)

### Phase 3 — Structured Data
- [ ] Organization + WebSite JSON-LD present on home page
- [ ] BreadcrumbList JSON-LD on brand and theme pages
- [ ] CollectionPage schema on listing pages
- [ ] Valid structured data (test with Google Rich Results Test)

### Phase 4 — Content
- [ ] Every listing page has H1 + intro paragraph
- [ ] Heading hierarchy is correct across all pages
- [ ] About page has rich E-E-A-T content
- [ ] Internal cross-links between related categories

### Phase 5 — GEO
- [ ] Citable content blocks on home and about pages
- [ ] Entity consistency for "DreamDiecast" everywhere
- [ ] Semantic HTML elements on all pages
- [ ] FAQ schema on about page

### Phase 6 — Images & Performance
- [ ] All product images have descriptive alt text
- [ ] OG image created and deployed
- [ ] Lighthouse SEO score >= 90
- [ ] No new paid dependencies added

### Overall
- [ ] All existing functionality (cart, auth, checkout, admin) works unchanged
- [ ] No Convex queries at build time (stays within free tier)
- [ ] `/seo audit` score reaches 60+

---

## 12. Final Score Projection

| Area | Weight | Before (Phase 0) | After Phase 6 | Notes |
|------|--------|-------------------|---------------|-------|
| Content Quality | 23% | 10 | 45 | Capped without blog/product pages |
| Technical SEO | 22% | 0 | 85 | robots, sitemap, canonical, crawlable |
| On-Page SEO | 20% | 5 | 80 | Metadata on every page, proper headings |
| Schema/Structured Data | 10% | 0 | 75 | Org, WebSite, Breadcrumb, Collection |
| Performance | 10% | 60 | 70 | Already decent, minor gains |
| GEO (AI Search) | 10% | 0 | 70 | AI bots allowed, citable content, entity signals |
| Images | 5% | 20 | 60 | Alt text, OG image, sizing |
| **Weighted Total** | **100%** | **~12** | **~65** | **+53 points** |

> **To reach 70+:** Individual product detail pages with Product schema (Phase 7), blog/content marketing (Phase 8), backlink building (Phase 9). These are outside current scope.

---

## 13. Diecast-Specific SEO Strategy

### Why This Matters for a Diecast Business

People searching for diecast products search very specifically:
- `"Hot Wheels Nissan Skyline GT-R R34 price India"`
- `"Mini GT Lamborghini Huracán buy online"`
- `"Tarmac Works diecast India"`
- `"1:64 diecast cars online India"`

**The current site is invisible to these searches** because:
1. No metadata tells Google what's on each page
2. No structured data tells Google these are products with prices
3. No text content on listing pages for Google to index
4. AI search engines can't crawl the site (no bot rules)

**After implementing all 6 phases:**
- Google knows every brand page exists (sitemap)
- Google understands each page's content (metadata + headings + intro text)
- Google knows DreamDiecast is an organization that sells diecast (schema)
- AI engines can cite DreamDiecast when asked about diecast in India (GEO)
- Product searches match against brand-specific keywords and descriptions

### Future Phase 7 — Individual Product Pages (Biggest Remaining Opportunity)

The single biggest SEO opportunity is creating dedicated `/products/[slug]` pages for each product. This would:
- Allow `Product` schema with price, availability, SKU
- Enable product-specific titles: "Hot Wheels Nissan Skyline GT-R R34 | DreamDiecast"
- Let Google index individual products for long-tail searches
- Qualify for Google Shopping rich results
- Add each product URL to sitemap

This is architecturally larger (requires Convex queries in metadata, ISR strategy) and is intentionally deferred to keep Phases 1-6 achievable without complexity.
