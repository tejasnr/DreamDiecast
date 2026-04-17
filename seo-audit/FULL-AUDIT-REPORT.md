# DreamDiecast SEO Audit Report
**URL:** https://dreamdiecast.in/
**Date:** 2026-04-17
**Business Type:** E-commerce (Premium Diecast Collectibles)
**Framework:** Next.js (App Router) + Convex Backend
**Hosting:** Vercel

---

## Executive Summary

### Overall SEO Health Score: 18/100

DreamDiecast has significant structural SEO deficiencies that are almost certainly preventing organic search visibility. The site is essentially invisible to search engines due to full client-side rendering, missing metadata infrastructure, and zero structured data.

### Top 5 Critical Issues
1. **Entire app is client-side rendered** — `'use client'` on `layout.tsx` prevents all Next.js SSR/SSG metadata features
2. **No robots.txt** — returns 404; search engines have no crawl directives
3. **No sitemap.xml** — returns 404; search engines can't discover pages
4. **No per-page metadata** — every page shares the same static `<title>` and `<meta description>`
5. **Products open as modals, not unique URLs** — product detail content is invisible to search engines

### Top 5 Quick Wins
1. Create `app/robots.ts` and `app/sitemap.ts` files (1 hour)
2. Add unique `<title>` and `<meta description>` per page via `<head>` tags in each page component (2 hours)
3. Fix product names "c", "q" — data quality issue visible to users (30 min)
4. Add Organization JSON-LD schema to layout (1 hour)
5. Add OG/Twitter meta tags for social sharing (1 hour)

---

## 1. Technical SEO (Score: 12/100)

### 1.1 Crawlability — CRITICAL

| Check | Status | Severity |
|-------|--------|----------|
| robots.txt | **MISSING (404)** | Critical |
| XML Sitemap | **MISSING (404)** | Critical |
| No `app/robots.ts` file | **MISSING** | Critical |
| No `app/sitemap.ts` file | **MISSING** | Critical |
| Internal linking | Basic nav + footer links | Medium |
| Crawl depth | Most pages 1-2 clicks from home | OK |

### 1.2 Indexability — CRITICAL

| Check | Status | Severity |
|-------|--------|----------|
| `'use client'` on layout.tsx | **All pages CSR** | Critical |
| No `generateMetadata` exports | **No dynamic meta** | Critical |
| Same title on all pages | "DreamDiecast \| Premium Diecast Collectibles" | Critical |
| Same description on all pages | Static in layout.tsx | Critical |
| No canonical tags | **MISSING** | High |
| No OG/Twitter meta tags | **MISSING** | High |
| No `hreflang` tags | N/A (single language) | OK |

**Root Cause:** The root `layout.tsx` (line 1) declares `'use client'`, which means:
- Next.js `metadata` export and `generateMetadata()` cannot be used (server-only features)
- All metadata is hardcoded in `<head>` tags within the client component
- No page-specific titles, descriptions, or OG tags
- Search engines may not render JavaScript-dependent content

### 1.3 Security & Headers

| Check | Status | Severity |
|-------|--------|----------|
| HTTPS | Yes (via Vercel) | OK |
| HSTS | Likely via Vercel defaults | OK |
| CSP headers | Not configured | Medium |
| X-Frame-Options | Not configured | Low |

### 1.4 URL Structure

| URL | Status |
|-----|--------|
| `/` | Clean |
| `/brands` | Clean |
| `/brands/[slug]` | Clean (e.g., `/brands/hotwheels`) |
| `/themes/[slug]` | Clean (e.g., `/themes/jdm-legends`) |
| `/products` | Clean but no individual product URLs |
| `/new-arrivals` | Clean |
| `/pre-orders` | Clean |
| `/bundles` | Clean |

**Issue:** Products do NOT have individual URLs. Clicking a product opens a modal overlay on `/products`. This means:
- Search engines cannot index individual products
- Products cannot rank for specific queries (e.g., "Mazda 787B diecast 1/64")
- No shareable product links
- No product-level metadata or schema possible

### 1.5 JavaScript Rendering

| Check | Status | Severity |
|-------|--------|----------|
| SSR/SSG usage | **None — full CSR** | Critical |
| Product data source | Convex (client-side fetch) | Critical |
| Googlebot rendering | May see empty/loading state | Critical |
| `suppressHydrationWarning` | Present on `<html>` and `<body>` | Low |

### 1.6 Redirects

| From | To | Type |
|------|-----|------|
| `/current-stock` | `/brands` | 301 (permanent) |

### 1.7 Next.js Configuration Issues

- `reactStrictMode: false` — not SEO-relevant but indicates dev maturity
- `eslint.ignoreDuringBuilds: true` — may miss SEO-relevant linting
- Remote image patterns include `picsum.photos` and `unsplash.com` — placeholder images in production

---

## 2. Content Quality (Score: 25/100)

### 2.1 E-E-A-T Assessment

| Signal | Status | Score |
|--------|--------|-------|
| **Experience** | No user reviews, no collector stories, no unboxing content | 1/5 |
| **Expertise** | About page mentions "passionate collectors" but no specifics | 2/5 |
| **Authoritativeness** | No press mentions, partnerships, or credentials cited | 1/5 |
| **Trustworthiness** | Contact info present, policies exist, Gmail email (not branded) | 2/5 |

### 2.2 Page-by-Page Content Analysis

| Page | Content Depth | Issues |
|------|--------------|--------|
| Homepage | Medium | Good hero section, brand grid, theme grid, featured products |
| About | Thin | ~150 words, generic claims, no founder story, no team, no photos |
| Shipping Policy | Adequate | Clear pricing and timeframes |
| Privacy Policy | Adequate | Covers basics |
| Returns & Refunds | Not checked | — |
| Products | Thin | Only 3 products visible, 2 with single-letter names ("c", "q") |
| Brands | Thin | Only brand logos/names, no descriptions |
| Brand pages | Not checked | Dynamic content |

### 2.3 Critical Content Issues

1. **Product data quality** — Products named "c" and "q" with incorrect/placeholder images (a lantern and a catapult instead of diecast cars)
2. **No blog or content hub** — Zero informational content for top-of-funnel queries
3. **No FAQ section** — Missing for common collector questions
4. **No product descriptions** — Product detail modal shows only specs (brand, scale, condition, type) with one-word "Special Features"
5. **Gmail email** (dreamdiecast@gmail.com) — Reduces trust vs. branded domain email

### 2.4 Missing Content Opportunities

- Collector guides ("How to start collecting 1/64 diecast models")
- Brand comparison content ("Mini GT vs Hot Wheels: Which is better?")
- Product reviews and unboxing
- Scale guide explainers
- New release announcements (blog)
- FAQs about authenticity, shipping, returns

---

## 3. On-Page SEO (Score: 10/100)

### 3.1 Title Tags

| Page | Title | Issue |
|------|-------|-------|
| All pages | "DreamDiecast \| Premium Diecast Collectibles" | **Same title everywhere** |

**Recommended format:** `{Page-specific title} | DreamDiecast`

Examples:
- Homepage: `Premium Diecast Collectibles - 1/64 Scale Models | DreamDiecast`
- Brands: `Shop by Brand - Hot Wheels, Mini GT, Tarmac Works | DreamDiecast`
- Products: `All Diecast Models | DreamDiecast`
- Product: `Mazda 787B 1/64 Pop Race - ₹1,799 | DreamDiecast`

### 3.2 Meta Descriptions

| Page | Description | Issue |
|------|-------------|-------|
| All pages | "Elevate your collection with exclusive diecast models from Pagani, Toyota, BMW and more." | **Same everywhere, mentions brands not actually sold** |

The description mentions "Pagani, Toyota, BMW" but the actual brands are Hot Wheels, Bburago, Mini GT, Pop Race, Tarmac Works, and Matchbox.

### 3.3 Heading Structure

**Homepage:**
- H1: "Your Dream Garage Scaled Down." ✓ (single H1)
- H2: "Featured Models", "Join the Inner Circle", "DreamDiecast" (footer) ✓
- H3: Product names (but "w", "q", "c", "b" are broken) ✗

**Products page:**
- H1: "All Models" ✓
- H3: Product names (broken: "c", "q") ✗

### 3.4 Internal Linking

| From | Links to | Quality |
|------|----------|---------|
| Homepage | 6 brand pages, 3 theme pages, /products | Good |
| Nav | /brands, /new-arrivals, /pre-orders, /bundles | Good |
| Footer | Home, About, policies, collections | Good |
| Products | No individual product URLs | **Critical gap** |
| Brand pages | Not cross-linked to themes | Medium gap |

### 3.5 Image Optimization

| Check | Status | Severity |
|-------|--------|----------|
| Alt text on hero | "Porsche 911 GT3 RS" | OK |
| Alt text on brand logos | Present (e.g., "Hot Wheels logo") | OK |
| Alt text on theme images | Present | OK |
| Alt text on products | **Broken** ("w", "q", "c", "b") | Critical |
| Image format | Using Next.js `<Image>` component | OK |
| Banner images | Unsplash stock photos | Medium |
| Product images | Hosted on Convex cloud | OK |

---

## 4. Schema & Structured Data (Score: 0/100)

### Current Implementation
**None.** Zero JSON-LD, Microdata, or RDFa detected anywhere on the site.

### Missing Schema Types (Priority Order)

| Schema Type | Priority | Where |
|-------------|----------|-------|
| `Organization` | Critical | Layout/all pages |
| `WebSite` + `SearchAction` | Critical | Homepage |
| `Product` | Critical | Product pages (once created) |
| `BreadcrumbList` | High | All pages |
| `CollectionPage` | High | Category/brand pages |
| `ItemList` | High | Product listing pages |
| `WebPage` | Medium | All pages |
| `FAQPage` | Medium | FAQ section (once created) |
| `Offer` | Medium | Product pages |
| `Review` / `AggregateRating` | Low | Product pages (once reviews exist) |

---

## 5. Performance / Core Web Vitals (Score: 30/100)

### 5.1 Observed Performance Signals

| Metric | Estimate | Notes |
|--------|----------|-------|
| LCP | ~3-5s (estimated) | Full CSR means content loads after JS execution |
| INP | Unknown | Convex real-time queries may cause UI delays |
| CLS | Low risk | Dark background, fixed layout |

### 5.2 Performance Issues

| Issue | Severity |
|-------|----------|
| Full client-side rendering (no SSR) | Critical |
| All product data fetched client-side from Convex | High |
| Unsplash stock images as banner backgrounds | Medium |
| PostHog analytics loaded on every page | Low |
| Vercel Analytics + Speed Insights (minimal impact) | OK |

### 5.3 Positive Signals

- Next.js `next/font` for font optimization (Inter, Space Grotesk)
- `next/image` component used for images
- Vercel hosting (CDN, edge network)
- Code splitting via Next.js dynamic imports

---

## 6. Images (Score: 30/100)

| Check | Status |
|-------|--------|
| Alt text coverage | ~70% (broken on products with bad names) |
| Image format | Mix of formats via Next.js Image |
| Lazy loading | Via Next.js Image default |
| OG/social preview images | **MISSING** |
| Product image quality | Good (where present) |
| Placeholder images in production | Yes (Unsplash stock for banners) |

---

## 7. AI Search Readiness (Score: 10/100)

### 7.1 AI Crawler Access

| Check | Status | Severity |
|-------|--------|----------|
| robots.txt (GPTBot, Google-Extended) | **No robots.txt exists** | Critical |
| llms.txt | **MISSING** | High |
| Structured content for AI extraction | **Poor** (CSR, no schema) | Critical |

### 7.2 Citability Assessment

| Factor | Score | Notes |
|--------|-------|-------|
| Factual, extractable statements | 1/5 | Content is thin and generic |
| Clear heading hierarchy | 2/5 | Headings exist but shallow |
| Statistical/data-rich content | 0/5 | No unique data or stats |
| Authority signals | 1/5 | No reviews, press, or credentials |
| Brand mention consistency | 2/5 | Brand names present but not in structured way |

### 7.3 Platform Readiness

| Platform | Ready? | Key Gap |
|----------|--------|---------|
| Google AI Overviews | No | CSR content, no schema, thin content |
| ChatGPT Web Search | No | No crawlable product data |
| Perplexity | No | No structured answers/FAQs |
| Bing Copilot | No | No schema, no rich content |

---

## 8. E-commerce Specific (Score: 15/100)

### 8.1 Product Page Architecture

| Check | Status | Severity |
|-------|--------|----------|
| Individual product URLs | **MISSING** — modal overlay only | Critical |
| Product schema markup | **MISSING** | Critical |
| Breadcrumb navigation | **MISSING** | High |
| Product reviews/ratings | UI exists but 0 reviews, "N/A" rating | Medium |
| Price display | Present (₹ format) | OK |
| Availability indicators | "Only Few Left", "Pre-Order" badges | OK |
| Add to Cart / Buy Now | Present | OK |

### 8.2 Category Pages

| Check | Status |
|-------|--------|
| Unique titles per category | **No** — all share same title |
| Category descriptions | **MISSING** |
| Faceted navigation | Filter buttons exist (All, Pre-Order, In Stock, New Arrival) |
| Pagination | Not observed (only 3 products visible) |

### 8.3 Google Shopping Readiness

| Requirement | Status |
|-------------|--------|
| Product structured data | **MISSING** |
| Unique product URLs | **MISSING** |
| Product feed (Google Merchant Center) | **Not possible without product URLs** |
| Price + availability in schema | **MISSING** |
| GTIN/MPN/SKU identifiers | **MISSING** |

### 8.4 Data Quality Issues

- Products with single-letter names: "c", "q", "b", "w"
- Product images showing non-diecast items (lantern, catapult)
- These appear to be test/placeholder data in production

---

## 9. Search Experience (SXO) Analysis

### 9.1 Target Query Intent Alignment

| Query | Intent | Current Page Type | Match? |
|-------|--------|-------------------|--------|
| "buy diecast cars online India" | Transactional | Homepage (no product URLs) | Partial |
| "diecast cars India" | Commercial | No optimized landing page | No |
| "Mini GT models India" | Commercial | /brands/minigt | Partial |
| "Mazda 787B 1/64 diecast" | Transactional | No product URL | No |
| "diecast car collection starter" | Informational | No content exists | No |
| "Hot Wheels premium India" | Commercial | /brands/hotwheels | Partial |

### 9.2 User Persona Scoring

| Persona | Experience Score | Key Gaps |
|---------|-----------------|----------|
| Serious Collector | 3/5 | No reviews, no detailed specs, no rarity info |
| Gift Buyer | 2/5 | No gift guides, no bundles visible, no recommendations |
| New Hobbyist | 1/5 | No educational content, no "how to start" guide |

---

## Scoring Summary

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 22% | 12/100 | 2.6 |
| Content Quality | 23% | 25/100 | 5.8 |
| On-Page SEO | 20% | 10/100 | 2.0 |
| Schema / Structured Data | 10% | 0/100 | 0.0 |
| Performance (CWV) | 10% | 30/100 | 3.0 |
| AI Search Readiness | 10% | 10/100 | 1.0 |
| Images | 5% | 30/100 | 1.5 |
| **TOTAL** | **100%** | — | **15.9 ≈ 16/100** |

---

## Screenshots

| Screenshot | Description |
|------------|-------------|
| `screenshots/homepage-desktop.png` | Full-page desktop homepage |
| `screenshots/homepage-mobile.png` | Full-page mobile homepage |
| `screenshots/products-page.png` | Products listing page (showing data quality issues) |
| `screenshots/product-detail-modal.png` | Product detail modal (Mazda 787B) |
