# Technical SEO Audit Report
**DreamDiecast.in | E-commerce Diecast Collectibles**

**Audit Date:** April 17, 2026
**Domain:** https://dreamdiecast.in/
**Platform:** Next.js (App Router) hosted on Vercel
**Location:** Bangalore, Karnataka, India

---

## Executive Summary

**Overall Technical SEO Score: 52/100**

DreamDiecast.in is a Next.js-based e-commerce platform with several critical technical SEO issues that significantly limit search engine visibility and indexability. While the site benefits from HTTPS, fast hosting infrastructure (Vercel), and mobile-responsive design, it lacks fundamental SEO requirements including robots.txt, XML sitemap, proper metadata architecture, and canonical tag implementation.

### Priority Level Breakdown
- **Critical Issues:** 4
- **High Priority:** 5
- **Medium Priority:** 4
- **Low Priority:** 2

---

## 1. Crawlability Analysis

### Status: FAIL (Score: 30/100)

#### Critical Issues

**1.1 Missing robots.txt**
- **Status:** HTTP 404
- **Impact:** Search engines have no crawling directives
- **Risk:** Uncontrolled crawling of admin pages, duplicate content issues
- **Current State:** No file exists at `/robots.txt`
- **Priority:** CRITICAL

**Finding:**
```
HTTP/2 404
x-matched-path: /404
```

**Recommendation:**
Create `app/robots.ts` with:
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: ['/api/', '/admin/', '/checkout/', '/garage/', '/pay/'],
      },
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/admin/', '/checkout/', '/garage/', '/pay/'],
      },
    ],
    sitemap: 'https://dreamdiecast.in/sitemap.xml',
  }
}
```

**1.2 Missing XML Sitemap**
- **Status:** HTTP 404
- **Impact:** Search engines cannot discover all pages efficiently
- **Risk:** Important product/brand pages may not be indexed
- **Priority:** CRITICAL

**Recommendation:**
Create `app/sitemap.ts`:
```typescript
import { MetadataRoute } from 'next'

export default async function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dreamdiecast.in'

  // Static pages
  const staticPages = [
    '',
    '/about',
    '/brands',
    '/new-arrivals',
    '/pre-orders',
    '/bundles',
    '/shipping-policy',
    '/returns',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))

  // TODO: Fetch dynamic brand pages from database
  // TODO: Fetch dynamic product pages from database
  // TODO: Fetch dynamic theme pages from database

  return [...staticPages]
}
```

**1.3 Internal Linking Structure**
- **Status:** PASS (Good)
- **Findings:**
  - Clean navigation with links to /brands, /new-arrivals, /pre-orders, /bundles
  - Footer contains secondary navigation (About, Shipping Policy, Returns, Privacy)
  - Proper HTML anchor tags used throughout

**1.4 JavaScript Rendering Concern**
- **Status:** WARNING
- **Finding:** Homepage uses `'use client'` directive with bailout to client-side rendering
- **Evidence:**
```html
<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template>
```
- **Impact:** Initial page load shows loading spinner, content not immediately crawlable
- **Risk:** Search engines may not wait for JavaScript execution
- **Priority:** HIGH

**Affected Pages:**
- `/` (homepage)
- `/brands`
- `/about`

**Recommendation:**
- Convert layout.tsx from client component to server component
- Move client-only code (ConvexProvider, PostHogProvider, AuthProvider) into separate client components
- Use Server Components for static content rendering

---

## 2. Indexability Analysis

### Status: FAIL (Score: 35/100)

#### Critical Issues

**2.1 Missing Canonical Tags**
- **Status:** FAIL
- **Impact:** No canonical URL signals for search engines
- **Risk:** Duplicate content issues, diluted ranking signals
- **Priority:** CRITICAL

**Findings:**
- No `<link rel="canonical">` tags found on any pages tested
- Pages: /, /about, /brands, /brands/hotwheels all missing canonical tags

**Recommendation:**
Add to `app/layout.tsx` or individual page metadata:
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://dreamdiecast.in'),
  // This will automatically generate canonical tags
}
```

For individual pages in `app/page.tsx` or other routes:
```typescript
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  alternates: {
    canonical: '/', // or specific path
  },
}
```

**2.2 Generic Metadata Across All Pages**
- **Status:** FAIL
- **Impact:** Every page has identical title and description
- **Priority:** HIGH

**Current Implementation:**
```html
<title>DreamDiecast | Premium Diecast Collectibles</title>
<meta name="description" content="Elevate your collection with exclusive diecast models from Pagani, Toyota, BMW and more."/>
```

**Affected Pages:**
- Homepage: Generic (should highlight featured collections)
- /about: Generic (should mention "About DreamDiecast")
- /brands: Generic (should list available brands)
- /brands/hotwheels: Generic (should be "Hot Wheels Diecast Models")

**Recommendation:**
Convert `app/layout.tsx` from client component to server component and remove hardcoded metadata from `<head>`. Use Next.js Metadata API:

For `/app/about/page.tsx`:
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | DreamDiecast - Premium Diecast Collectibles',
  description: 'Learn about DreamDiecast, India\'s premier destination for premium diecast car collectibles. Founded by passionate collectors in Bangalore.',
  alternates: {
    canonical: '/about',
  },
}
```

For `/app/brands/[slug]/page.tsx`:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const brand = await fetchBrandData(params.slug)

  return {
    title: `${brand.name} Diecast Models | DreamDiecast`,
    description: `Shop authentic ${brand.name} diecast collectibles. ${brand.modelCount}+ models available. Free shipping across India.`,
    alternates: {
      canonical: `/brands/${params.slug}`,
    },
  }
}
```

**2.3 No Meta Robots Tags Detected**
- **Status:** NEUTRAL (Default: index, follow)
- **Finding:** No explicit noindex tags found
- **Recommendation:** Add explicit `<meta name="robots" content="noindex, nofollow">` to:
  - `/admin/*` pages
  - `/checkout/*` pages
  - `/garage/*` pages
  - `/pay/*` pages
  - `/api/*` endpoints

**2.4 Duplicate Content Risk**
- **Status:** WARNING
- **Risk:** Same metadata across all pages creates duplicate content signals
- **Priority:** HIGH

---

## 3. Security Analysis

### Status: PARTIAL PASS (Score: 60/100)

#### Positive Findings

**3.1 HTTPS Implementation**
- **Status:** PASS
- **Certificate:** Valid
- **TLS Version:** TLS 1.3 (HTTP/2)

**3.2 HSTS Header Present**
- **Status:** PASS
```
strict-transport-security: max-age=63072000
```
- **Duration:** 2 years
- **Note:** Missing `includeSubDomains` and `preload` directives

**Recommendation:**
Add to Vercel configuration or `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }
      ]
    }
  ]
}
```

#### Missing Security Headers

**3.3 Content-Security-Policy (CSP)**
- **Status:** MISSING
- **Impact:** No protection against XSS attacks
- **Priority:** HIGH

**3.4 X-Frame-Options**
- **Status:** MISSING
- **Impact:** Site vulnerable to clickjacking attacks
- **Priority:** MEDIUM

**3.5 X-Content-Type-Options**
- **Status:** MISSING
- **Impact:** MIME-sniffing vulnerability
- **Priority:** MEDIUM

**3.6 Referrer-Policy**
- **Status:** MISSING
- **Impact:** Referrer information not controlled
- **Priority:** LOW

**3.7 Permissions-Policy**
- **Status:** MISSING
- **Impact:** No control over browser feature access
- **Priority:** LOW

**Comprehensive Security Headers Recommendation:**
Add to `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com *.vercel-insights.com *.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' *.convex.cloud *.posthog.com *.vercel-insights.com;"
        }
      ]
    }
  ]
}
```

---

## 4. URL Structure Analysis

### Status: PASS (Score: 85/100)

**4.1 Clean URL Architecture**
- **Status:** EXCELLENT
- **Examples:**
  - `/brands` (not `/brands.html`)
  - `/brands/hotwheels` (dynamic slug-based)
  - `/new-arrivals` (hyphenated, lowercase)
  - `/shipping-policy` (descriptive)

**4.2 Redirect Chain Analysis**
- **Status:** PASS
- **Tested:** `/current-stock` → `/brands` (HTTP 301 permanent redirect configured)
- **Finding:** Single redirect hop, properly configured in `next.config.ts`

**4.3 URL Consistency**
- **Status:** PASS
- **HTTPS enforced:** Yes (HSTS active)
- **Trailing slash handling:** Consistent (none used)

**4.4 URL Parameters**
- **Status:** CLEAN
- **Finding:** No session IDs or tracking parameters in URLs
- **Note:** `/pay/[preOrderId]` uses clean path segments

---

## 5. Mobile Optimization

### Status: PASS (Score: 90/100)

**5.1 Viewport Meta Tag**
- **Status:** PASS
```html
<meta name="viewport" content="width=device-width, initial-scale=1"/>
```

**5.2 Responsive Design Signals**
- **Status:** EXCELLENT
- **Evidence:**
  - Tailwind CSS utility classes with breakpoints (`md:`, `lg:`)
  - Mobile menu implementation detected (`md:hidden` menu button)
  - Responsive grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
  - Fluid typography (`text-4xl md:text-6xl`)

**5.3 Touch Target Size**
- **Status:** LIKELY PASS
- **Evidence:** Buttons use padding (`px-6 py-2.5`, `px-8 py-4`)
- **Recommendation:** Verify minimum 48x48px touch targets on actual devices

**5.4 Mobile-Friendly Navigation**
- **Status:** PASS
- **Finding:** Hamburger menu implemented for mobile viewports

---

## 6. Core Web Vitals Assessment

### Status: POTENTIAL ISSUES (Score: 55/100)

**Note:** This assessment is based on HTML structure analysis. Real-world metrics should be measured using Google PageSpeed Insights, Lighthouse, or Chrome User Experience Report (CrUX).

#### 6.1 Largest Contentful Paint (LCP)

**Target:** <2.5s (Good) | 2.5-4s (Needs Improvement) | >4s (Poor)

**Potential Issues Identified:**

1. **Client-Side Rendering Bailout**
   - **Impact:** HIGH
   - **Evidence:** `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template>`
   - **Effect:** Content not immediately available in HTML, requires JavaScript execution
   - **Expected Impact:** +1-2s to LCP

2. **Loading Spinner Delay**
   - **Finding:** Pages show loading spinner before content appears
   - **Code:**
   ```html
   <div class="min-h-screen bg-[#050505] flex items-center justify-center">
     <div class="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
   </div>
   ```

3. **Positive Signals:**
   - Font preloading implemented:
   ```html
   <link rel="preload" href="/_next/static/media/36966cca54120369-s.p.woff2" as="font" crossorigin="" type="font/woff2"/>
   ```
   - Image preloading on brands page:
   ```html
   <link rel="preload" as="image" href="/assets/hotwheels.png"/>
   ```
   - Next.js Image component used (optimization built-in)

**Priority:** CRITICAL

**Recommendations:**
1. Convert to Server Components to eliminate client-side rendering delay
2. Implement `priority` prop on hero images
3. Remove loading spinner for server-rendered pages
4. Use `next/font` properly (already implemented but verify optimization)

#### 6.2 Interaction to Next Paint (INP)

**Target:** <200ms (Good) | 200-500ms (Needs Improvement) | >500ms (Poor)

**Potential Issues:**

1. **Heavy JavaScript Bundles**
   - **Evidence:** Multiple large async chunks loaded:
     - `main-app-3508d7d738d26cdf.js`
     - `webpack-5d8b8b0a70f9ca95.js`
     - Multiple provider wrappers (Convex, PostHog, Auth, Cart)

2. **Client-Side State Management Overhead**
   - **Finding:** 4 context providers wrapping entire app
   - **Code:** ConvexProvider → PostHogProvider → AuthProvider → CartProvider
   - **Impact:** Potential interaction delays during hydration

**Priority:** MEDIUM

**Recommendations:**
1. Code-split providers (load PostHog only when analytics needed)
2. Implement dynamic imports for non-critical features
3. Use `next/dynamic` with `ssr: false` for client-only components
4. Monitor actual INP metrics with Vercel Speed Insights (already installed)

#### 6.3 Cumulative Layout Shift (CLS)

**Target:** <0.1 (Good) | 0.1-0.25 (Needs Improvement) | >0.25 (Poor)

**Potential Issues:**

1. **Image Dimensions Not Always Specified**
   - **Risk:** Images loading may cause layout shift
   - **Mitigation:** Next.js Image component used with width/height props (needs verification on all images)

2. **Font Loading**
   - **Status:** GOOD
   - **Evidence:** Using `next/font` with CSS variables, font swap handled automatically

3. **Loading States**
   - **Risk:** Content appears after loading spinner disappears (full layout change)
   - **Impact:** Could cause CLS >0.25

**Priority:** MEDIUM

**Recommendations:**
1. Ensure all images have explicit width/height or aspect ratio
2. Use skeleton loaders instead of full-page loading spinners
3. Reserve space for dynamic content
4. Implement CSS `aspect-ratio` for responsive images

#### 6.4 Server-Side Rendering Concern

**Current Architecture:**
- `app/layout.tsx`: Client component (`'use client'`)
- `app/page.tsx`: Client component (`'use client'`)
- Result: Full client-side rendering for critical pages

**Impact:**
- LCP delayed by JavaScript parse/execution time
- Search engines may not see content immediately
- Potential indexing issues

**Priority:** CRITICAL

**Recommended Architecture:**
```
app/
├── layout.tsx (SERVER COMPONENT - remove 'use client')
├── page.tsx (SERVER COMPONENT - remove 'use client')
├── providers.tsx (client component with all providers)
└── components/
    ├── Navbar.tsx (can be server if no interactivity)
    ├── Hero.tsx (server component, use client only for interactive parts)
    └── ...
```

---

## 7. Structured Data

### Status: MISSING (Score: 0/100)

**7.1 JSON-LD Schema**
- **Status:** NOT FOUND
- **Impact:** Rich snippets not available in search results
- **Priority:** HIGH

**Recommendations:**

**Organization Schema (add to `app/layout.tsx`):**
```typescript
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "DreamDiecast",
  "description": "Premium Diecast Collectibles",
  "url": "https://dreamdiecast.in",
  "logo": "https://dreamdiecast.in/logo.png",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Bangalore",
    "addressRegion": "Karnataka",
    "addressCountry": "IN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-91487-24708",
    "email": "dreamdiecast@gmail.com",
    "contactType": "Customer Service"
  },
  "sameAs": [
    "https://www.instagram.com/dreamdiecastofficial/",
    "https://wa.me/919148724708"
  ]
}
</script>
```

**Product Schema (for individual product pages):**
```typescript
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": "product-image-url",
  "description": "Product description",
  "brand": {
    "@type": "Brand",
    "name": "Brand Name"
  },
  "offers": {
    "@type": "Offer",
    "price": "999",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "url": "https://dreamdiecast.in/products/slug"
  }
}
```

**Breadcrumb Schema (for navigation):**
```typescript
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://dreamdiecast.in"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Brands",
      "item": "https://dreamdiecast.in/brands"
    }
  ]
}
```

---

## 8. JavaScript Rendering

### Status: CONCERN (Score: 45/100)

**8.1 Client-Side vs Server-Side Rendering**

**Current Implementation:**
- **Layout:** Client component (entire app)
- **Homepage:** Client component
- **Product pages:** Client component (based on bailout template)

**Issues:**
1. **SEO Risk:** Content not in initial HTML response
2. **Performance Impact:** JavaScript must execute before content visible
3. **Crawl Budget:** Search engines must execute JavaScript (not guaranteed)

**Evidence:**
```html
<!--$!--><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template>
<div class="min-h-screen bg-[#050505] flex items-center justify-center">
  <div class="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
</div>
<!--/$-->
```

**8.2 Hybrid Rendering Analysis**

**Good:**
- Using Next.js App Router (supports SSR)
- Vercel hosting (optimized for Next.js SSR)
- Static content exists in footer (server-rendered)

**Bad:**
- Client-side bailout prevents initial SSR
- Unnecessary client components for static content

**8.3 Prerendering Status**

**Detected Headers:**
```
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
```

**Positive:** Some pages are prerendered (brands, about)
**Negative:** Prerendering bypassed by client component wrapper

**Priority:** CRITICAL

**Recommendations:**

1. **Refactor Root Layout:**
```typescript
// app/layout.tsx (SERVER COMPONENT)
import { Inter, Space_Grotesk } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Providers from '@/components/Providers' // NEW client component
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })

export const metadata = {
  metadataBase: new URL('https://dreamdiecast.in'),
  title: {
    default: 'DreamDiecast | Premium Diecast Collectibles',
    template: '%s | DreamDiecast'
  },
  description: 'Elevate your collection with exclusive diecast models from Pagani, Toyota, BMW and more.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#050505] text-white antialiased">
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

2. **Create Providers Component:**
```typescript
// components/Providers.tsx
'use client'

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import PostHogProvider from '@/components/PostHogProvider'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export default function Providers({ children }) {
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
  )
}
```

3. **Refactor Homepage:**
```typescript
// app/page.tsx (SERVER COMPONENT)
import Hero from '@/components/Hero'
import BrandGrid from '@/components/BrandGrid'
import ThemeGrid from '@/components/ThemeGrid'
import ProductGrid from '@/components/ProductGrid'
import InnerCircle from '@/components/InnerCircle'
import ExpiredToast from '@/components/ExpiredToast' // client component

export const metadata = {
  title: 'Premium Diecast Collectibles',
  description: 'Discover exclusive diecast models from Hot Wheels, Bburago, Mini GT, and more. Free shipping across India.',
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <ExpiredToast />
      <Hero />
      <BrandGrid />
      <ThemeGrid />
      <ProductGrid />
      <InnerCircle />
    </main>
  )
}
```

---

## 9. HTTP Response Headers Analysis

### Status: GOOD (Score: 75/100)

**9.1 Positive Findings**

```http
HTTP/2 200
server: Vercel
content-type: text/html; charset=utf-8
cache-control: public, max-age=0, must-revalidate
strict-transport-security: max-age=63072000
x-vercel-cache: HIT
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
etag: "5a3e5dc8c52d0d3517291614a7957622"
accept-ranges: bytes
access-control-allow-origin: *
```

**Strengths:**
- HTTP/2 protocol (faster multiplexing)
- Vercel edge caching active (`x-vercel-cache: HIT`)
- ETags for cache validation
- HSTS header present
- ISR (Incremental Static Regeneration) configured (stale-time: 300s)

**9.2 Areas for Improvement**

1. **CORS Header Too Permissive**
   - `access-control-allow-origin: *`
   - **Risk:** Any domain can make requests
   - **Recommendation:** Restrict to specific origins if API is used

2. **Missing Vary Header for SEO**
   - Current: `vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`
   - **Missing:** `Vary: User-Agent` for mobile/desktop differentiation
   - **Impact:** Low (same HTML served to all devices)

3. **Cache Headers for Static Assets**
   - CSS/JS files should have longer max-age
   - **Recommendation:** Let Next.js/Vercel handle (already optimized with hashed filenames)

---

## 10. Additional Technical Considerations

### 10.1 IndexNow Protocol

**Status:** NOT IMPLEMENTED
**Priority:** LOW (but beneficial)

**What is IndexNow?**
IndexNow is a protocol allowing websites to notify search engines (Bing, Yandex, Naver) about content changes instantly, reducing crawl delays.

**Implementation:**
1. Generate API key at https://www.bing.com/indexnow
2. Create `/app/[api-key].txt` with the key
3. Implement API endpoint to notify on content changes:

```typescript
// app/api/indexnow/route.ts
export async function POST(request: Request) {
  const { url } = await request.json()

  const indexNowUrl = 'https://api.indexnow.org/indexnow'
  const response = await fetch(indexNowUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: 'dreamdiecast.in',
      key: process.env.INDEXNOW_API_KEY,
      keyLocation: `https://dreamdiecast.in/${process.env.INDEXNOW_API_KEY}.txt`,
      urlList: [url]
    })
  })

  return Response.json({ submitted: true })
}
```

### 10.2 Open Graph & Twitter Cards

**Status:** MISSING
**Priority:** MEDIUM

**Current State:** No OG tags detected

**Recommendation:**
Add to metadata:
```typescript
export const metadata = {
  openGraph: {
    title: 'DreamDiecast | Premium Diecast Collectibles',
    description: 'Elevate your collection with exclusive diecast models',
    url: 'https://dreamdiecast.in',
    siteName: 'DreamDiecast',
    images: [
      {
        url: 'https://dreamdiecast.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DreamDiecast Collection',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DreamDiecast | Premium Diecast Collectibles',
    description: 'Elevate your collection with exclusive diecast models',
    images: ['https://dreamdiecast.in/og-image.jpg'],
  },
}
```

### 10.3 Favicon & Web App Manifest

**Status:** NOT DETECTED
**Priority:** MEDIUM

**Recommendation:**
Add to `/app`:
- `favicon.ico`
- `apple-touch-icon.png`
- `icon.png` (or `icon.svg`)
- `manifest.json` (or `manifest.webmanifest`)

Next.js will automatically generate the necessary tags.

### 10.4 Language Declaration

**Status:** PASS
```html
<html lang="en">
```

**Recommendation:**
If targeting Indian market specifically, consider `lang="en-IN"` and add hreflang tags if multiple language versions exist in the future.

### 10.5 Accessibility (Impacts SEO)

**Status:** GOOD (based on HTML analysis)

**Positive Findings:**
- Semantic HTML (`<nav>`, `<main>`, `<footer>`, `<section>`)
- `aria-hidden="true"` on decorative SVG icons
- Alt text on images (brands page shows `alt="Hot Wheels logo"`)

**Recommendation:**
- Verify all images have meaningful alt text
- Ensure color contrast ratios meet WCAG AA standards
- Add ARIA labels to interactive elements without text

---

## Priority Action Plan

### Immediate Actions (Week 1)

1. **Create robots.txt** (`app/robots.ts`)
   - Block admin, checkout, API routes
   - Reference sitemap

2. **Create XML sitemap** (`app/sitemap.ts`)
   - Include all static pages
   - Fetch dynamic pages from database
   - Update weekly

3. **Convert layout to Server Component**
   - Move all providers to separate client component
   - Remove `'use client'` from `app/layout.tsx`
   - Implement proper Metadata API

4. **Add canonical tags**
   - Implement via Metadata API on all pages
   - Set `metadataBase` in root layout

### Short-term Actions (Week 2-3)

5. **Implement dynamic metadata**
   - Create `generateMetadata()` for brand pages
   - Create unique titles/descriptions for all routes
   - Add Open Graph tags

6. **Add security headers**
   - Implement CSP, X-Frame-Options, etc. in `next.config.ts`
   - Update HSTS to include subdomains and preload

7. **Convert homepage to Server Component**
   - Keep only interactive parts as client components
   - Move `useSearchParams()` to dedicated client component

8. **Implement structured data**
   - Add Organization schema to layout
   - Add Product schema to product pages
   - Add Breadcrumb schema

### Medium-term Actions (Month 1-2)

9. **Optimize Core Web Vitals**
   - Monitor real metrics with Speed Insights
   - Implement skeleton loaders
   - Optimize images with priority prop

10. **Add meta robots tags**
    - Noindex admin/checkout pages
    - Nofollow on external user-generated content links

11. **Implement IndexNow**
    - Set up API key
    - Notify on product updates

12. **Create OG images**
    - Generate dynamic OG images with `@vercel/og`
    - Add Twitter Card tags

---

## Monitoring & Maintenance

### Tools to Implement

1. **Google Search Console**
   - Verify domain ownership
   - Submit sitemap
   - Monitor crawl errors and coverage

2. **Bing Webmaster Tools**
   - Submit sitemap
   - Enable IndexNow
   - Monitor Indian market performance

3. **Schema Markup Validator**
   - Test structured data: https://validator.schema.org/
   - Google Rich Results Test: https://search.google.com/test/rich-results

4. **PageSpeed Insights**
   - Monitor Core Web Vitals
   - Test both mobile and desktop
   - Track field data (CrUX) monthly

5. **Vercel Analytics & Speed Insights**
   - Already installed
   - Monitor real user metrics
   - Track performance over time

### Ongoing Tasks

- **Weekly:** Review Search Console for new issues
- **Monthly:** Audit metadata for new pages
- **Quarterly:** Re-run technical SEO audit
- **Continuous:** Monitor Core Web Vitals scores

---

## Technical Specifications

### Current Stack
- **Framework:** Next.js (App Router)
- **Hosting:** Vercel (Edge Network)
- **Database:** Convex (serverless)
- **Analytics:** Vercel Analytics, PostHog
- **Styling:** Tailwind CSS
- **Language:** TypeScript

### Performance Budget Recommendations
- **LCP:** <2.5s (target: <2.0s)
- **INP:** <200ms (target: <100ms)
- **CLS:** <0.1 (target: <0.05)
- **JavaScript bundle:** <200KB (target: <150KB)
- **Total page size:** <1MB (target: <500KB)

---

## Conclusion

DreamDiecast.in has a solid technical foundation with Next.js and Vercel hosting but requires immediate attention to fundamental SEO requirements. The most critical issues are:

1. Missing robots.txt and sitemap (preventing proper crawling/indexing)
2. Client-side rendering bailout (delaying content visibility)
3. Generic metadata across all pages (hurting rankings)
4. No canonical tags (risking duplicate content penalties)

By implementing the recommended fixes in the priority order above, the site can achieve:
- **3-6 months:** 80+ technical SEO score
- **6-12 months:** Top rankings for branded searches (e.g., "Hot Wheels diecast India")
- **12+ months:** Competitive rankings for category keywords (e.g., "buy diecast cars online")

The architectural changes (Server Components refactor) will have the highest impact on both SEO and user experience, reducing Time to First Byte (TTFB) and improving Core Web Vitals scores significantly.

---

**Report Generated:** April 17, 2026
**Audited By:** Claude (Technical SEO Specialist)
**Next Review:** May 17, 2026
