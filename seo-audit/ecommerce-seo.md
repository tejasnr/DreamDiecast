# E-Commerce SEO Audit - DreamDiecast.in

**Analysis Date:** April 17, 2026
**Site:** https://dreamdiecast.in/
**Platform:** Next.js (Vercel hosting)
**Business Type:** Premium diecast collectibles retailer
**Target Market:** India (Bangalore-based)

---

## Executive Summary

**Overall E-Commerce SEO Score: 18/100**

DreamDiecast.in is a Next.js e-commerce site with significant SEO infrastructure gaps that severely limit discoverability in Google Search, Google Shopping, and AI-powered search engines. While the site has strong technical fundamentals (Next.js, responsive design, fast hosting), critical e-commerce SEO elements are missing.

### Critical Blockers

| Issue | Impact | Priority |
|-------|--------|----------|
| No Product schema markup | Not eligible for Google Shopping rich results | **CRITICAL** |
| Root layout is client component | Blocks Next.js Metadata API entirely | **CRITICAL** |
| No robots.txt or sitemap.xml | Search engines cannot discover/crawl pages | **CRITICAL** |
| No structured data (Organization, BreadcrumbList) | Google cannot understand site structure | **CRITICAL** |
| Duplicate titles across all pages | Every page shows same generic title | **CRITICAL** |
| No H1 tags on product listing pages | Missing primary content signal | **HIGH** |
| No Open Graph or Twitter Card tags | Poor social sharing experience | **HIGH** |
| Missing canonical URLs | Risk of duplicate content penalties | **HIGH** |
| No price or availability markup | Cannot appear in price comparison tools | **HIGH** |

---

## 1. Product Schema Validation (Score: 0/100)

### Current State
- **No Product schema detected** on any page
- **No Offer schema** with pricing information
- **No Brand schema** connecting products to manufacturers
- **No AggregateRating schema** for reviews (feature not present)

### Impact
- **Not eligible for Google Shopping rich results** (product cards with price, availability, ratings)
- **Cannot be discovered via Google Shopping** search or price comparison
- **Missing from Google Merchant Center** feeds
- **No AI search citations** (ChatGPT, Perplexity cannot extract product data)

### Recommendations

#### Priority 1: Implement Product Schema on Individual Product Pages

Once individual product detail pages are created (`/products/[slug]`), add Product schema:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Hot Wheels Nissan Skyline GT-R R34 Premium 1:64",
  "description": "Premium diecast model of the iconic Nissan Skyline GT-R R34 in 1:64 scale",
  "image": "https://dreamdiecast.in/products/hw-skyline-gtr.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Hot Wheels"
  },
  "sku": "HW-SKYLINE-R34-2024",
  "offers": {
    "@type": "Offer",
    "price": "599",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "url": "https://dreamdiecast.in/products/hw-skyline-gtr-r34",
    "seller": {
      "@type": "Organization",
      "name": "DreamDiecast"
    }
  }
}
```

**Required fields for Google Shopping eligibility:**
- `name` (product name)
- `image` (at least 800x800px)
- `offers.price`
- `offers.priceCurrency`
- `offers.availability` (InStock, PreOrder, OutOfStock)
- `offers.url` (product page URL)

**Recommended fields:**
- `description` (unique, 500-1000 characters)
- `brand.name`
- `sku` (unique identifier)
- `gtin` or `mpn` (if available from manufacturer)

#### Priority 2: Add ItemList Schema on Category Pages

For `/brands`, `/new-arrivals`, `/pre-orders` pages:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Hot Wheels Diecast Models",
  "numberOfItems": 47,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Product",
        "name": "Hot Wheels Nissan Skyline GT-R R34",
        "url": "https://dreamdiecast.in/products/hw-skyline-gtr-r34",
        "image": "...",
        "offers": {
          "@type": "Offer",
          "price": "599",
          "priceCurrency": "INR"
        }
      }
    }
  ]
}
```

---

## 2. Google Shopping Readiness (Score: 0/100)

### Current State: NOT READY

**Missing Requirements:**
- No Product schema markup
- No Google Merchant Center feed
- No GTIN/MPN identifiers
- No individual product pages (products shown in modals only)
- No price/availability structured data

### Readiness Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Individual product URLs | ❌ Missing | Products shown in modals, no `/products/[slug]` pages |
| Product schema | ❌ Missing | No structured data at all |
| Price markup | ❌ Missing | Prices shown visually but not in schema |
| Availability markup | ❌ Missing | Stock status not marked up |
| High-res images (>800px) | ⚠️ Unknown | Need to verify image sizes |
| Unique product descriptions | ❌ Missing | Products have names only, no descriptions |
| GTIN/MPN codes | ⚠️ Unknown | Need to verify if available from suppliers |
| Valid SSL certificate | ✅ Present | HTTPS working correctly |
| Mobile-friendly | ✅ Present | Responsive Next.js site |

### Path to Google Shopping Eligibility

**Phase 1: Architecture Changes (4-6 weeks)**
1. Create individual product pages at `/products/[slug]`
2. Implement server-side rendering for product pages
3. Add Product schema to each product page
4. Ensure each product has unique URL, title, description

**Phase 2: Data Enrichment (2-3 weeks)**
1. Add detailed product descriptions (500+ words per product)
2. Obtain GTIN/MPN codes from brand distributors
3. Ensure product images are minimum 800x800px
4. Add product specifications (scale, material, year, edition)

**Phase 3: Merchant Center Setup (1-2 weeks)**
1. Create Google Merchant Center account
2. Generate product feed (XML/JSON)
3. Submit feed and verify data quality
4. Monitor for policy compliance issues

**Estimated Timeline:** 7-11 weeks to full Google Shopping eligibility

---

## 3. Category Page Optimization (Score: 25/100)

### Current State Analysis

**Brands Page** (`/brands`)
- ✅ Has H1: "Shop by Brand"
- ✅ Brand logos have proper alt text ("Hot Wheels logo", "Bburago logo")
- ❌ No introductory content explaining what brands are available
- ❌ No meta description (uses site default)
- ❌ No Open Graph tags
- ❌ Title is generic: "DreamDiecast | Premium Diecast Collectibles"

**Products Page** (`/products`)
- ❌ No H1 tag
- ❌ No introductory content
- ❌ Same generic title/description as all pages
- ❌ No filtering metadata (brand, scale, price range)
- ⚠️ Product images rendered client-side (no alt text visible to crawlers)

**Pre-Orders Page** (`/pre-orders`)
- ❌ No H1 tag
- ❌ No explanation of pre-order process
- ❌ Same generic metadata
- ❌ No distinction between deposit vs full payment in markup

**New Arrivals Page** (`/new-arrivals`)
- ❌ No H1 tag
- ❌ No content explaining update frequency
- ❌ Missing date indicators for "newness"

### Recommendations

#### Add Descriptive Content Blocks

Each category page needs 150-250 word intro paragraph with:
- What's available in this category
- Why shop this category
- What makes DreamDiecast different
- Key brands/products available
- Target keywords naturally integrated

**Example for `/products`:**
```html
<section class="max-w-4xl mx-auto px-4 py-8 text-center">
  <h1 class="text-3xl font-bold mb-4">Premium Diecast Car Models - In Stock</h1>
  <p class="text-gray-400 text-lg leading-relaxed">
    Browse India's largest curated collection of premium diecast models.
    From Hot Wheels and Mini GT to Tarmac Works and Bburago, we stock
    1:64, 1:43, and 1:24 scale collectibles from the world's top brands.
    Whether you're hunting JDM legends like the Nissan Skyline GT-R,
    exotic hypercars like Lamborghini and Ferrari, or motorsport liveries
    from Le Mans and F1—your next grail piece is here. All models ship
    from Bangalore with secure packaging and authenticity guaranteed.
  </p>
</section>
```

#### Implement Category-Specific Metadata

Create `layout.tsx` files for each route with unique metadata:

```tsx
// app/products/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Diecast Models - In Stock | DreamDiecast',
  description: 'Browse all available diecast car models. Hot Wheels, Mini GT, Tarmac Works, Bburago & more at DreamDiecast India.',
  openGraph: {
    title: 'All Diecast Models - In Stock',
    description: 'Browse all available diecast car models from top brands worldwide.',
    url: 'https://dreamdiecast.in/products',
  },
  alternates: { canonical: 'https://dreamdiecast.in/products' },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

#### Add Breadcrumb Schema

All category pages need BreadcrumbList schema:

```json
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
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Hot Wheels",
      "item": "https://dreamdiecast.in/brands/hotwheels"
    }
  ]
}
```

---

## 4. Product Page SEO Elements (Score: N/A - No Individual Pages)

### Current Architecture Issue

Products are displayed in **modal overlays** rather than individual pages. This architecture has severe SEO consequences:

**Problems:**
- No unique URL per product (cannot be bookmarked, shared, or indexed)
- No per-product metadata (title, description, OG tags)
- No product-level schema markup
- Cannot be discovered via search (only via category pages)
- Modal content may not be crawlable by search bots

**Example:** When clicking "Hot Wheels Nissan Skyline GT-R R34", the URL remains `/products` instead of changing to `/products/hw-skyline-gtr-r34`.

### Recommended Architecture

**Implement individual product pages at `/products/[slug]`:**

```
/products/hw-nissan-skyline-gtr-r34
/products/minigt-lamborghini-huracan-sto
/products/tarmac-toyota-gr-supra-racing
```

Each page should have:
1. **Unique URL** - Shareable, indexable
2. **Server-side rendering** - Content available to crawlers immediately
3. **Metadata exports** - Title, description, OG tags
4. **Product schema** - Price, availability, brand
5. **Breadcrumb navigation** - Home > Brands > Hot Wheels > [Product]
6. **Related products** - Internal linking to similar items
7. **Rich content** - Description, specifications, shipping info

### Migration Path

1. **Phase 1:** Create parallel product detail pages (keep modals working)
2. **Phase 2:** Update internal links to point to detail pages
3. **Phase 3:** Add schema markup to detail pages
4. **Phase 4:** Deprecate modal-only behavior (redirect to detail page)

---

## 5. Pricing and Availability Markup (Score: 0/100)

### Current State
- Prices displayed visually but **not marked up in HTML or schema**
- Availability status (In Stock, Pre-Order, Out of Stock) not structured
- No currency markup
- No price history or discount indicators

### Impact
- **Cannot appear in price comparison engines**
- **Not eligible for Google Shopping price grids**
- **AI search engines cannot extract pricing** for comparisons
- **No rich snippets with price in search results**

### Recommendations

#### Add Price Microdata to Product Cards

Even on listing pages, add microdata attributes:

```html
<div itemscope itemtype="https://schema.org/Product">
  <h3 itemprop="name">Hot Wheels Nissan Skyline GT-R R34</h3>
  <img itemprop="image" src="/products/hw-skyline.jpg" alt="..." />
  <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
    <meta itemprop="priceCurrency" content="INR" />
    <span itemprop="price" content="599">₹599</span>
    <link itemprop="availability" href="https://schema.org/InStock" />
    <span>In Stock</span>
  </div>
</div>
```

#### Implement Availability Schema

Map availability states to schema.org vocabulary:

| UI State | Schema URL |
|----------|------------|
| In Stock | `https://schema.org/InStock` |
| Pre-Order | `https://schema.org/PreOrder` |
| Out of Stock | `https://schema.org/OutOfStock` |
| Limited Stock | `https://schema.org/LimitedAvailability` |

#### Add Price Valid Date for Pre-Orders

For pre-order items, specify price validity:

```json
{
  "@type": "Offer",
  "price": "1299",
  "priceCurrency": "INR",
  "availability": "https://schema.org/PreOrder",
  "priceValidUntil": "2026-06-30",
  "availabilityStarts": "2026-07-15"
}
```

---

## 6. Review/Rating Schema (Score: N/A - Feature Not Implemented)

### Current State
- No review system present on site
- No rating aggregation
- No user-generated content

### Future Implementation Path

When implementing reviews (recommended for trust signals and SEO):

1. **AggregateRating schema** on product pages:
```json
{
  "@type": "Product",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "89"
  }
}
```

2. **Individual Review schema** for each review:
```json
{
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": "Rajesh Kumar"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "reviewBody": "Excellent quality diecast model. Detailed paint work and packaging was secure."
}
```

3. **Benefits:**
   - Star ratings in search results (significantly increases CTR)
   - Trust signals for new customers
   - User-generated content (SEO value)
   - Social proof for conversions

---

## 7. Breadcrumb Navigation (Score: 10/100)

### Current State
- **No visible breadcrumb navigation** on any page
- **No BreadcrumbList schema** detected
- Navigation relies only on navbar (categories not hierarchical)

### Impact
- Users cannot easily navigate category hierarchy
- Search engines cannot understand site structure
- Missing breadcrumb rich results in Google Search
- Poor user experience for deep navigation

### Recommendations

#### Add Visual Breadcrumbs

Implement breadcrumb component on all pages except homepage:

```tsx
// components/Breadcrumbs.tsx
export default function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" class="py-4 px-6">
      <ol class="flex items-center space-x-2 text-sm text-white/60">
        {items.map((item, i) => (
          <li key={i} class="flex items-center">
            {i > 0 && <span class="mx-2">/</span>}
            {i === items.length - 1 ? (
              <span class="text-white">{item.name}</span>
            ) : (
              <a href={item.href} class="hover:text-accent">{item.name}</a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

**Example usage:**
- Home > Brands > Hot Wheels
- Home > New Arrivals
- Home > Products > Hot Wheels Nissan Skyline GT-R R34

#### Add BreadcrumbList Schema

On every page with breadcrumbs, add JSON-LD:

```json
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

## 8. Faceted Navigation SEO (Score: 15/100)

### Current State
- Brand filtering present on `/products` page
- **No URL parameter strategy** for filters (client-side only)
- **No indexed filter combinations** (e.g., `/products?brand=hotwheels&scale=1:64`)
- **Filter state not preserved in URL** (cannot share filtered view)

### Issues with Current Implementation

**Problems:**
1. **Crawlers cannot discover filter combinations** - All variations hidden behind JavaScript
2. **Users cannot bookmark or share filtered views** - No URL changes when filtering
3. **Lost SEO opportunity for long-tail keywords** - "1:64 Hot Wheels India" not indexed
4. **No faceted navigation best practices** - Risk of duplicate content if implemented incorrectly

### Recommendations

#### Implement URL-Based Filtering

Update filtering to use Next.js router:

```tsx
// When filter changes:
const router = useRouter();
router.push(`/products?brand=hotwheels&scale=1:64&sort=price-asc`);
```

#### Add Canonical + Robots Strategy

**For parameterized URLs:**

```tsx
// For /products?brand=hotwheels
export const metadata: Metadata = {
  title: 'Hot Wheels Diecast Models | DreamDiecast',
  alternates: {
    canonical: 'https://dreamdiecast.in/brands/hotwheels' // Point to main brand page
  }
};
```

**For pagination:**
```html
<link rel="canonical" href="https://dreamdiecast.in/products" />
<link rel="prev" href="https://dreamdiecast.in/products?page=1" />
<link rel="next" href="https://dreamdiecast.in/products?page=3" />
```

#### Use rel="nofollow" on Low-Value Filters

For filter combinations unlikely to be searched:
- Sort order variations
- Multiple simultaneous filters
- Very narrow combinations (0-1 results)

```html
<a href="/products?brand=hotwheels&color=red&year=2024" rel="nofollow">...</a>
```

#### Create Static Pages for High-Value Filters

Instead of relying on parameters, create dedicated pages:
- `/brands/hotwheels` (instead of `/products?brand=hotwheels`)
- `/scale/1-64` (instead of `/products?scale=1:64`)
- `/themes/jdm-legends` (already implemented - good!)

---

## 9. Cart and Checkout SEO Considerations (Score: 70/100)

### Current State
- `/checkout` route exists
- `/order-success` route exists
- ✅ Cart functionality present
- ⚠️ No noindex detected on checkout/cart pages

### Recommendations

#### Add noindex to Transactional Pages

Create `layout.tsx` for private routes:

```tsx
// app/checkout/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

**Apply to:**
- `/checkout`
- `/checkout/details`
- `/pay/*`
- `/order-success`
- `/garage` (user account)
- `/admin/*` (already done via robots.txt)

#### Implement Order Schema for Confirmation Pages

On `/order-success/[orderId]`, add Order schema:

```json
{
  "@context": "https://schema.org",
  "@type": "Order",
  "orderNumber": "DD-2024-00123",
  "orderStatus": "https://schema.org/OrderProcessing",
  "orderDate": "2026-04-17",
  "orderedItem": [
    {
      "@type": "OrderItem",
      "orderItemNumber": "1",
      "orderQuantity": 1,
      "orderedItem": {
        "@type": "Product",
        "name": "Hot Wheels Nissan Skyline GT-R R34"
      }
    }
  ],
  "seller": {
    "@type": "Organization",
    "name": "DreamDiecast"
  }
}
```

This enables Gmail/Outlook to parse order emails with "Track Package" buttons.

---

## 10. Marketplace Visibility (Score: 0/100)

### Analysis: Amazon India / Flipkart Potential

**Current Channels:**
- Direct website only
- No marketplace presence detected
- No comparison shopping engine listings

### Amazon India Integration Path

**Requirements:**
1. Amazon Seller Central India account
2. Product catalog with GTINs/ISBNs (if available)
3. High-quality product photos (min 1000x1000px)
4. Inventory management integration
5. Fulfillment strategy (FBA vs self-ship)

**Pros:**
- Access to 500M+ monthly visitors
- Trust signal (Amazon brand credibility)
- Faster customer acquisition
- Built-in payment/logistics

**Cons:**
- 10-15% referral fees + 2-3% payment fees
- Loss of direct customer relationships
- Competition from other sellers (including counterfeits)
- Brand dilution concerns for premium positioning

### Flipkart Integration Path

**Similar to Amazon:**
- Flipkart Seller Hub registration
- Category typically: Sports, Fitness & Outdoors > Toys & Games
- Referral fees: 12-20% depending on category
- GST compliance mandatory

### Google Merchant Center (Non-Marketplace)

**Recommended first step before marketplaces:**
1. Create Google Merchant Center account
2. Submit product feed (auto-generated from Convex database)
3. Link to Google Ads account (optional paid promotion)
4. Products appear in Google Shopping tab organically

**Advantage:** Drive traffic to owned website, no referral fees, maintain brand control.

### Recommendation Priority

**Phase 1:** Google Merchant Center (0-cost organic visibility)
**Phase 2:** Amazon India (test with top 20 SKUs)
**Phase 3:** Flipkart (if Amazon proves profitable)

---

## Technical SEO Foundation Issues

### Critical: Root Layout is Client Component

**Current State:**
```tsx
'use client';  // <-- BLOCKS METADATA API

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>DreamDiecast | Premium Diecast Collectibles</title>
        <meta name="description" content="..." />
      </head>
      <body>...</body>
    </html>
  );
}
```

**Problem:**
- `'use client'` directive **prevents `export const metadata`** (Next.js limitation)
- Forces manual `<head>` tags (hard-coded title/description on every page)
- Cannot use `generateMetadata()` for dynamic pages
- No template-based title generation

**Solution:** Refactor to server component + client provider wrapper (see seo-overhaul.md Phase 1)

### Critical: No robots.txt or sitemap.xml

**Current State:**
- ❌ `/robots.txt` returns 404 with noindex meta tag
- ❌ `/sitemap.xml` returns 404 with noindex meta tag
- Search engines have no crawl guidance
- AI bots (GPTBot, ClaudeBot, PerplexityBot) have no access rules

**Impact:**
- Google may not discover key pages
- Crawl budget wasted on admin/checkout pages
- AI search engines cannot index site
- Competitor sites rank for "{brand} diecast India" while DreamDiecast is invisible

**Solution:** Create `app/robots.ts` and `app/sitemap.ts` (see seo-overhaul.md Phase 1)

### Critical: No Structured Data Whatsoever

**Current State:**
- ❌ No Organization schema
- ❌ No WebSite schema
- ❌ No Product schema
- ❌ No BreadcrumbList schema
- ❌ No SearchAction schema

**Impact:**
- Google cannot understand what DreamDiecast is
- No rich results in search (no brand box, no sitelinks)
- No "site search" shortcut in Google
- AI engines cannot extract entity relationships

---

## E-Commerce SEO Scoring Breakdown

| Category | Weight | Score | Weighted | Notes |
|----------|--------|-------|----------|-------|
| **Product Schema** | 25% | 0 | 0.0 | No Product schema anywhere |
| **Category Optimization** | 20% | 25 | 5.0 | Has H1 on brands page only, no content |
| **Pricing/Availability** | 15% | 0 | 0.0 | No structured pricing data |
| **Technical Foundation** | 15% | 10 | 1.5 | Next.js + HTTPS, but no robots/sitemap |
| **Internal Linking** | 10% | 30 | 3.0 | Nav structure present, no breadcrumbs |
| **Content Quality** | 10% | 15 | 1.5 | Minimal descriptive content |
| **Image Optimization** | 5% | 40 | 2.0 | Next/Image used, alt text on brand logos only |
| **Mobile Optimization** | 5% | 100 | 5.0 | Fully responsive |
| **Marketplace Readiness** | 5% | 0 | 0.0 | Not ready for any marketplace |
| **TOTAL** | **100%** | | **18/100** | |

---

## Prioritized Action Plan

### Immediate (Week 1-2) - Foundation

**Score Impact: +20 points**

1. **Refactor root layout to server component** (see seo-overhaul.md Phase 1)
   - Enables metadata API
   - Prerequisite for all other SEO work

2. **Create robots.txt and sitemap.xml** (see seo-overhaul.md Phase 1)
   - Allows search engines to crawl site
   - Adds AI bot access rules

3. **Add Organization and WebSite schema** to homepage
   - Establishes entity identity
   - Enables Google Knowledge Graph entry

4. **Add per-page metadata** to all public routes
   - Unique titles and descriptions
   - Open Graph tags for social sharing

### Short-Term (Week 3-6) - Content & Structure

**Score Impact: +15 points**

5. **Add H1 and intro content** to all category pages
   - Products, brands, pre-orders, new arrivals
   - 150-250 words each with target keywords

6. **Implement breadcrumb navigation** with schema
   - Visual breadcrumbs on all pages
   - BreadcrumbList JSON-LD

7. **Add CollectionPage schema** to category pages
   - Helps Google understand page purpose

8. **Add descriptive alt text** to all product images
   - Pattern: "{Brand} {Model} {Scale} Diecast Model"

### Medium-Term (Week 7-14) - Product Pages

**Score Impact: +30 points**

9. **Create individual product detail pages** (`/products/[slug]`)
   - Server-side rendered
   - Unique URL per product
   - Shareable and indexable

10. **Implement Product schema** on detail pages
    - Price, availability, brand
    - Unique descriptions (500+ words per product)
    - High-res images (min 800x800px)

11. **Add ItemList schema** to category pages
    - Links to individual product pages

12. **Generate product-level sitemap**
    - All product URLs in sitemap.xml

### Long-Term (Week 15+) - Marketplace & Advanced

**Score Impact: +17 points**

13. **Set up Google Merchant Center**
    - Product feed generation
    - Shopping campaign (optional paid)

14. **Obtain GTIN/MPN codes** from distributors
    - Enables Google Shopping eligibility
    - Better product matching

15. **Implement review system** with schema
    - AggregateRating for star ratings in search
    - User-generated content for SEO

16. **Test Amazon India marketplace** integration
    - Start with top 20 SKUs
    - Monitor profitability vs direct sales

---

## Expected Outcomes

### After Immediate Actions (Week 2)
- Site discoverable by search engines
- Each page has unique title/description
- Basic structured data present
- **Estimated Score: 38/100**

### After Short-Term Actions (Week 6)
- Category pages optimized for keywords
- Breadcrumb navigation implemented
- Content-rich pages with proper headings
- **Estimated Score: 53/100**

### After Medium-Term Actions (Week 14)
- Individual product pages live
- Product schema fully implemented
- Eligible for Google Shopping (pending approval)
- **Estimated Score: 83/100**

### After Long-Term Actions (Week 20+)
- Active Google Merchant Center feed
- Review system with star ratings in search
- Potential marketplace presence
- **Estimated Score: 95/100**

---

## Data Source Notes

- **Analysis Method:** On-page HTML parsing via custom Python scripts
- **Data Freshness:** Live site data as of April 17, 2026
- **Structured Data Detection:** JSON-LD parser (no schema detected)
- **Platform Detection:** Next.js confirmed via `_next` chunks
- **DataForSEO Merchant API:** Not used (requires cost approval per project guidelines)

---

## Key Competitive Insights

**Why This Matters for DreamDiecast:**

Collectors searching for specific models use very targeted queries:
- "Hot Wheels Nissan Skyline GT-R R34 price India"
- "Mini GT Lamborghini Huracán buy online"
- "Tarmac Works diecast Bangalore"
- "1:64 diecast cars India pre-order"

**Current visibility for these searches: NEAR ZERO**

After implementing recommendations:
- Individual product pages will rank for long-tail queries
- Google Shopping presence drives qualified traffic
- AI search engines (ChatGPT, Perplexity) can cite DreamDiecast
- Social sharing improves with proper Open Graph tags

---

## References

- **SEO Overhaul Plan:** `/Users/tejasnr/Downloads/DreamDiecast/specs/seo-overhaul.md`
- **Google Product Schema Guide:** https://developers.google.com/search/docs/appearance/structured-data/product
- **Google Merchant Center:** https://merchants.google.com/
- **Next.js Metadata API:** https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- **Schema.org Product:** https://schema.org/Product
- **Google Shopping Policies:** https://support.google.com/merchants/answer/6149970

---

## Appendix: Detected Site Characteristics

**Platform Signals:**
- Next.js confirmed (`_next` static chunks)
- Vercel hosting (inferred from deployment patterns)
- Convex backend (ConvexProvider in layout)
- PostHog analytics
- Vercel Analytics + Speed Insights

**E-Commerce Signals:**
- Shopping cart functionality detected
- Brand filtering present
- Pre-order system implemented
- Bundles/packages feature
- User account system (garage)
- Admin panel (order fulfillment)

**Technical Stack:**
- React Server Components (partial - layout is client)
- Next.js 15+ (async params patterns)
- Tailwind CSS
- Lucide icons
- Google Fonts (Inter, Space Grotesk)

**Contact Information:**
- Email: dreamdiecast@gmail.com
- Phone: +91 91487 24708
- Location: Bangalore, Karnataka, India
- Instagram: @dreamdiecastofficial
- WhatsApp: +91 91487 24708

---

**Report Generated:** April 17, 2026
**Analysis Agent:** claude-seo-ecommerce v1.0
**Next Review:** After Phase 1 implementation (2 weeks)
