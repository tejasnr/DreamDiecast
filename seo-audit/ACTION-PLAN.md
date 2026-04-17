# DreamDiecast SEO Action Plan
**Current Score:** 16/100 | **Target Score:** 65+ within 90 days

---

## CRITICAL Priority (Fix Immediately — Blocks Indexing)

### 1. Remove `'use client'` from root layout and restructure for SSR
**Impact:** Unlocks all Next.js SEO features (metadata, SSR, generateMetadata)
**Effort:** High (8-16 hours) — requires refactoring client-only providers into separate client components
**Files:** `app/layout.tsx`

**How:**
- Create a `app/providers.tsx` client component that wraps `ConvexProvider`, `PostHogProvider`, `AuthProvider`, `CartProvider`
- Make `layout.tsx` a Server Component with proper `metadata` export
- Wrap `{children}` with the client Providers component

```tsx
// app/layout.tsx (Server Component)
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: { default: 'DreamDiecast | Premium 1/64 Diecast Collectibles', template: '%s | DreamDiecast' },
  description: 'India\'s premier destination for premium 1/64 scale diecast models. Shop Hot Wheels, Mini GT, Tarmac Works, Pop Race, Bburago & Matchbox.',
  // ... OG tags, Twitter tags, etc.
};
```

### 2. Create individual product pages with unique URLs
**Impact:** Products become indexable, rankable, and shareable
**Effort:** High (8-16 hours)
**Files:** Create `app/products/[slug]/page.tsx`

**How:**
- Create dynamic route `app/products/[slug]/page.tsx`
- Generate product slugs from product names (e.g., `mazda-787b-pop-race-1-64`)
- Implement `generateMetadata()` for per-product titles, descriptions, OG images
- Add Product JSON-LD schema
- Keep the modal for quick-view but make product cards link to `/products/[slug]`

### 3. Create robots.txt
**Impact:** Directs search engine crawling
**Effort:** Low (15 minutes)
**File:** Create `app/robots.ts`

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/checkout', '/garage', '/pay'] },
    ],
    sitemap: 'https://dreamdiecast.in/sitemap.xml',
  };
}
```

### 4. Create XML Sitemap
**Impact:** Search engines discover all pages
**Effort:** Medium (2-4 hours) — needs to query Convex for product/brand slugs
**File:** Create `app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch products and brands from Convex
  const staticPages = [
    { url: 'https://dreamdiecast.in/', changeFrequency: 'daily', priority: 1 },
    { url: 'https://dreamdiecast.in/brands', changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://dreamdiecast.in/new-arrivals', changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://dreamdiecast.in/pre-orders', changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://dreamdiecast.in/products', changeFrequency: 'daily', priority: 0.7 },
    { url: 'https://dreamdiecast.in/about', changeFrequency: 'monthly', priority: 0.3 },
    // ... dynamic product and brand pages
  ];
  return staticPages;
}
```

### 5. Fix product data quality
**Impact:** Broken product names and images directly harm user trust and SEO
**Effort:** Low (30 minutes — database fix)

- Fix products named "c", "q", "b", "w" with proper names
- Replace non-diecast placeholder images (lantern, catapult) with actual product photos
- Ensure all products have descriptive names matching the actual model

---

## HIGH Priority (Fix Within 1 Week)

### 6. Add per-page metadata with `generateMetadata()`
**Impact:** Unique titles and descriptions for every page
**Effort:** Medium (3-4 hours)
**Files:** All `app/**/page.tsx` files

Each page should export metadata or use `generateMetadata()`:
- `/brands` → "Shop Diecast Cars by Brand | DreamDiecast"
- `/brands/hotwheels` → "Hot Wheels Diecast Models | DreamDiecast"
- `/new-arrivals` → "New Diecast Arrivals | DreamDiecast"
- `/pre-orders` → "Pre-Order Upcoming Diecast Models | DreamDiecast"
- `/products/[slug]` → "{Product Name} {Scale} by {Brand} | DreamDiecast"

### 7. Add Organization JSON-LD schema
**Impact:** Rich results, knowledge panel eligibility
**Effort:** Low (1 hour)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DreamDiecast",
  "url": "https://dreamdiecast.in",
  "logo": "https://dreamdiecast.in/logo.png",
  "description": "India's premier destination for premium diecast car collectibles",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-91487-24708",
    "email": "dreamdiecast@gmail.com",
    "contactType": "customer service"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Bangalore",
    "addressRegion": "Karnataka",
    "addressCountry": "IN"
  },
  "sameAs": [
    "https://www.instagram.com/dreamdiecastofficial/"
  ]
}
```

### 8. Add Product schema on product pages
**Impact:** Rich product results in search (price, availability, reviews)
**Effort:** Medium (2-3 hours, after product pages created)

### 9. Add OG and Twitter meta tags
**Impact:** Social sharing, link previews
**Effort:** Low (1-2 hours)

Add to metadata:
```ts
openGraph: {
  type: 'website',
  locale: 'en_IN',
  url: 'https://dreamdiecast.in',
  siteName: 'DreamDiecast',
  images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'DreamDiecast' }],
},
twitter: {
  card: 'summary_large_image',
}
```

### 10. Add canonical tags
**Impact:** Prevents duplicate content issues
**Effort:** Low (included with metadata restructure)

### 11. Add breadcrumb navigation + BreadcrumbList schema
**Impact:** Better UX + rich breadcrumb display in SERPs
**Effort:** Medium (2-3 hours)

Example: Home > Brands > Hot Wheels > [Product Name]

---

## MEDIUM Priority (Fix Within 1 Month)

### 12. Enrich About page with E-E-A-T content
- Add founder story and photos
- Add specific expertise details (years collecting, brand partnerships)
- Use branded email (info@dreamdiecast.in) instead of Gmail
- Add trust badges, payment method logos

### 13. Add category/brand page descriptions
- Each brand page should have 100-200 words about the brand
- Category pages need descriptive intro paragraphs
- Target keywords: "buy {brand} diecast India", "{brand} 1/64 scale models"

### 14. Create FAQ section
- Target questions: "Are your models authentic?", "What scale are the models?", "Do you ship internationally?"
- Add FAQPage schema markup

### 15. Implement WebSite schema with SearchAction
- Enables sitelinks search box in Google results

### 16. Add CollectionPage schema to category pages

### 17. Create llms.txt for AI crawler guidance
**File:** `public/llms.txt`

### 18. Replace Unsplash stock banners with branded photography

### 19. Add product review functionality
- The UI exists (star rating, review count) but no reviews
- Implement review collection (post-purchase email flow)
- Add Review/AggregateRating schema once reviews exist

---

## LOW Priority (Backlog)

### 20. Start a blog/content hub
- Collector guides, unboxing content, new release announcements
- Target informational queries: "best 1/64 diecast cars", "diecast collecting guide"
- Build topical authority

### 21. Google Merchant Center integration
- Product feed for Google Shopping (requires product URLs + schema first)

### 22. Implement hreflang if expanding beyond India

### 23. Add security headers (CSP, X-Frame-Options)

### 24. Consider SSG for static pages (about, policies)
- These pages don't need client-side data fetching

### 25. Set up Google Search Console and submit sitemap

---

## Implementation Roadmap

### Week 1 — Foundation
- [ ] Restructure layout.tsx for SSR (remove 'use client')
- [ ] Create robots.ts
- [ ] Create sitemap.ts (static pages first)
- [ ] Fix product data quality (names, images)
- [ ] Add per-page metadata

### Week 2 — Product Pages
- [ ] Create `app/products/[slug]/page.tsx` with SSR
- [ ] Implement generateMetadata for product pages
- [ ] Add Product JSON-LD schema
- [ ] Add breadcrumbs
- [ ] Update sitemap with product URLs

### Week 3 — Rich Data
- [ ] Add Organization schema
- [ ] Add OG/Twitter meta tags
- [ ] Add WebSite schema
- [ ] Create llms.txt
- [ ] Enrich About page

### Week 4 — Content & Monitoring
- [ ] Add category descriptions
- [ ] Create FAQ section + FAQPage schema
- [ ] Submit sitemap to Google Search Console
- [ ] Set up SEO monitoring
- [ ] Replace stock images

### Month 2-3 — Growth
- [ ] Start blog/content hub
- [ ] Google Merchant Center setup
- [ ] Product review collection
- [ ] Link building / brand partnerships

---

## Expected Impact

| Timeframe | Projected Score | Key Milestone |
|-----------|----------------|---------------|
| Current | 16/100 | Baseline |
| After Week 1 | 35/100 | Crawlable, indexable, basic metadata |
| After Week 2 | 50/100 | Product pages rankable |
| After Week 4 | 65/100 | Rich results, content quality |
| After Month 3 | 75+/100 | Content authority, reviews, Shopping |
