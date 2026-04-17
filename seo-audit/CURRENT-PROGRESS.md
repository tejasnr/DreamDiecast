# DreamDiecast SEO Implementation Progress
**Started:** 2026-04-17 | **Baseline Score:** 16/100
**Last updated:** 2026-04-17
**Spec reference:** `specs/seo-overhaul.md`

---

## Phase Completion Summary

| Phase | Focus | Status | Items Done | Items Remaining |
|-------|-------|--------|------------|-----------------|
| **Phase 1** | Technical Foundation | **DONE** | 5/5 | 0 |
| **Phase 2** | On-Page Metadata | **MOSTLY DONE** | 6/9 | 3 (noindex layouts) |
| **Phase 3** | Structured Data | **DONE** | 6/6 | 0 |
| **Phase 4** | Content & E-E-A-T | **MOSTLY DONE** | 4/7 | 3 |
| **Phase 5** | GEO + AI Search | **MOSTLY DONE** | 4/6 | 2 |
| **Phase 6** | Images + Performance | **PARTIAL** | 1/7 | 6 |

---

## Phase 1 — Technical Foundation: COMPLETE

- [x] Refactor `layout.tsx` to Server Component (`app/layout.tsx` — no `'use client'`)
- [x] Create `providers.tsx` with all client providers (`app/providers.tsx`)
- [x] Create `app/robots.ts` (allows all crawlers, blocks admin/checkout/garage/pay/order-success, AI bots allowed)
- [x] Create `app/sitemap.ts` (10 static + 6 brand + 3 theme + **dynamic product URLs** via ConvexHttpClient)
- [x] Create `lib/seo.ts` (SITE_URL, SITE_NAME, BRAND_SEO for 6 brands, THEME_SEO for 3 themes)

## Phase 2 — On-Page Metadata: MOSTLY COMPLETE

- [x] Every public page has unique `<title>`, `<meta description>`, and `canonical`
- [x] Dynamic brand pages use `generateMetadata()` with enriched keywords + OG from `lib/seo.ts`
- [x] Dynamic theme pages use `generateMetadata()` with enriched keywords + OG from `lib/seo.ts`
- [x] `/privacy`, `/returns`, `/shipping-policy` have metadata exports
- [x] Product detail pages (`/products/[slug]`) have dynamic metadata with OG images
- [x] OG + Twitter card tags on root layout and product pages
- [ ] **MISSING: noindex `robots` meta on `/privacy`, `/returns`, `/shipping-policy`** (spec Phase 2.3 says add `robots: { index: false, follow: false }`)
- [ ] **MISSING: noindex layout.tsx for `/admin`** (spec Phase 2.3)
- [ ] **MISSING: noindex layout.tsx for `/checkout`, `/garage`, `/pay`, `/order-success`** (spec Phase 2.3 — currently only blocked via robots.txt disallow, no meta-level noindex)

## Phase 3 — Structured Data: COMPLETE

- [x] `OrganizationJsonLd` in root layout (name, URL, logo, contact, address, sameAs)
- [x] `WebSiteJsonLd` in root layout (SearchAction for sitelinks)
- [x] `Store` JSON-LD on homepage (priceRange, currenciesAccepted, paymentAccepted, address)
- [x] `BreadcrumbJsonLd` on all collection pages: `/products`, `/brands`, `/brands/[slug]`, `/themes/[slug]`, `/new-arrivals`, `/pre-orders`, `/bundles`, `/about`
- [x] `CollectionPageJsonLd` on all listing pages: `/products`, `/brands`, `/brands/[slug]`, `/themes/[slug]`, `/new-arrivals`, `/pre-orders`, `/bundles`
- [x] `Product` JSON-LD on `/products/[slug]` (name, brand, price, availability, SKU, scale, condition, ratings, reviews) + Breadcrumb

## Phase 4 — Content & E-E-A-T: MOSTLY COMPLETE

- [x] About page enriched with E-E-A-T content (founding story, brand list, mission, trust signals, contact info, FAQ section)
- [x] Proper heading hierarchy on About page (H1 > H2 > H3, semantic `<article>`)
- [x] FAQ section with 6 Q&As rendered visibly on About page
- [x] Homepage citable content block ("India's Premier Diecast Destination")
- [ ] **MISSING: Brand-specific intro content on `/brands/[slug]` pages** (spec Phase 4.1 — each brand page should have 80-150 word intro paragraph about the brand's history and strengths)
- [ ] **MISSING: Visible breadcrumb navigation on brand/theme pages** (spec Phase 4.4 — JSON-LD breadcrumbs are present but no visible `<nav>` breadcrumb UI)
- [ ] **MISSING: Internal cross-links between related categories** (spec Phase 4.4 — brand pages should link to related themes, theme pages to relevant brands)

## Phase 5 — GEO + AI Search: MOSTLY COMPLETE

- [x] AI bot access in `robots.ts` (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended)
- [x] `public/llms.txt` created (brands, categories, themes, key facts, page URLs)
- [x] Citable content blocks on homepage and About page
- [x] Entity consistency — "DreamDiecast" used across all metadata, schemas, and content
- [ ] **MISSING: Semantic HTML elements** (spec Phase 5.4 — `<article>` on content blocks, `<nav>` for breadcrumbs, `<main>` wrapper, `<aside>` for filters)
- [ ] **MISSING: `FAQJsonLd` schema on About page** — WAIT, this IS done (About page includes `<FAQJsonLd items={FAQ_ITEMS} />`)
- [x] FAQ schema on About page (6 FAQs with FAQPage JSON-LD)

**Revised Phase 5 remaining:**
- [ ] **MISSING: Semantic HTML elements** (spec Phase 5.4)

## Phase 6 — Images + Performance: PARTIAL

- [x] ProductCard alt text updated to descriptive pattern: `{Brand} {Name} {Scale} Scale Diecast Model`
- [ ] **MISSING: ProductDetailClient image alt text** (spec Phase 6.1)
- [ ] **MISSING: BrandCard alt text** (spec Phase 6.1)
- [ ] **MISSING: `public/og-image.png`** (1200x630 branded OG image — requires design work)
- [ ] **MISSING: `priority` prop on above-the-fold hero images** (spec Phase 6.3)
- [ ] **MISSING: `<link rel="preconnect">` for Convex and image CDN domains** (spec Phase 6.4)
- [ ] **MISSING: Lighthouse SEO audit validation** (spec Phase 6.4)

---

## Files Created (17 new files)
| File | Purpose | Phase |
|------|---------|-------|
| `app/providers.tsx` | Client-side provider wrapper | 1 |
| `app/robots.ts` | Search engine crawl directives + AI bot access | 1 |
| `app/sitemap.ts` | XML sitemap (static + dynamic product URLs) | 1 |
| `lib/seo.ts` | Centralized SEO constants, brand/theme keyword data | 1 |
| `lib/slugify.ts` | Product slug generation & ID extraction | 1 |
| `app/HomeClient.tsx` | Homepage client component | 1 |
| `app/products/ProductsClient.tsx` | Products listing client component | 1 |
| `app/products/[slug]/page.tsx` | Individual product page (server) | 1 |
| `app/products/[slug]/ProductDetailClient.tsx` | Product detail client component | 1 |
| `app/new-arrivals/NewArrivalsClient.tsx` | New arrivals client component | 1 |
| `app/pre-orders/PreOrdersClient.tsx` | Pre-orders client component | 1 |
| `app/bundles/BundlesClient.tsx` | Bundles client component | 1 |
| `app/brands/BrandsClient.tsx` | Brands listing client component | 1 |
| `app/brands/[slug]/BrandDetailClient.tsx` | Brand detail client component | 1 |
| `app/themes/[slug]/ThemeClient.tsx` | Theme detail client component | 1 |
| `components/JsonLd.tsx` | Reusable JSON-LD (Org, WebSite, Breadcrumb, Collection, FAQ, generic) | 3 |
| `public/llms.txt` | AI crawler content guide | 5 |

## Files Modified (16 files)
| File | Change | Phase |
|------|--------|-------|
| `app/layout.tsx` | Removed `'use client'`, added Metadata export, JSON-LD, OG/Twitter tags | 1 |
| `app/page.tsx` | Server component wrapper + Store schema JSON-LD | 1, 3 |
| `app/products/page.tsx` | Server component + Breadcrumb + CollectionPage schema | 2, 3 |
| `app/brands/page.tsx` | Server component + Breadcrumb + CollectionPage schema | 2, 3 |
| `app/brands/[slug]/page.tsx` | Breadcrumb + CollectionPage schema, enriched metadata (keywords, OG) | 2, 3 |
| `app/themes/[slug]/page.tsx` | Breadcrumb + CollectionPage schema, enriched metadata (keywords, OG) | 2, 3 |
| `app/new-arrivals/page.tsx` | Server component + Breadcrumb + CollectionPage schema | 2, 3 |
| `app/pre-orders/page.tsx` | Server component + Breadcrumb + CollectionPage schema | 2, 3 |
| `app/bundles/page.tsx` | Server component + Breadcrumb + CollectionPage schema | 2, 3 |
| `app/about/page.tsx` | Enriched E-E-A-T content, FAQ section + FAQJsonLd, breadcrumbs | 4, 5 |
| `app/HomeClient.tsx` | Added citable content block for AI search | 5 |
| `app/privacy/page.tsx` | Added metadata export | 2 |
| `app/shipping-policy/page.tsx` | Added metadata export | 2 |
| `app/returns/page.tsx` | Added metadata export | 2 |
| `convex/products.ts` | Added `getById` query | 1 |
| `components/ProductCard.tsx` | Descriptive alt text + Link to product page | 6 |

---

## Remaining TODO (ordered by impact)

### HIGH Impact (code changes)
1. [ ] Add `robots: { index: false, follow: false }` to metadata on `/privacy`, `/returns`, `/shipping-policy`
2. [ ] Create noindex `layout.tsx` for `/admin`, `/checkout`, `/garage`, `/pay`, `/order-success`
3. [ ] Add visible breadcrumb `<nav>` UI to brand and theme pages
4. [ ] Add brand-specific intro paragraphs (80-150 words) to `/brands/[slug]` client component

### MEDIUM Impact (code changes)
5. [ ] Update ProductDetailClient image alt text to descriptive pattern
6. [ ] Update BrandCard image alt text
7. [ ] Add `priority` prop on hero/above-fold images
8. [ ] Add `<link rel="preconnect">` for external domains in layout
9. [ ] Wrap listing page content in semantic HTML (`<main>`, `<article>`, `<nav>`, `<aside>`)
10. [ ] Add internal cross-links between brands and themes

### Requires Non-Code Work
11. [ ] Create `public/og-image.png` (1200x630 branded design)
12. [ ] Fix product data quality in Convex DB (names "c", "q", "b", "w" and placeholder images)
13. [ ] Replace Unsplash stock banners with branded photography
14. [ ] Set up Google Search Console and submit sitemap
15. [ ] Run Lighthouse SEO audit — target score >= 90

### LOW Priority / Future Phases
16. [ ] Start blog/content hub (Phase 7+)
17. [ ] Google Merchant Center integration
18. [ ] Add security headers (CSP, X-Frame-Options)
19. [ ] Add product review functionality

---

## Estimated Score

| Category | Weight | Before | Current (est.) | After All TODO |
|----------|--------|--------|----------------|----------------|
| Technical SEO | 22% | 0 | 78 | 85 |
| Content Quality | 23% | 10 | 42 | 50 |
| On-Page SEO | 20% | 5 | 75 | 82 |
| Schema/Structured Data | 10% | 0 | 75 | 75 |
| Performance (CWV) | 10% | 60 | 62 | 70 |
| GEO (AI Search) | 10% | 0 | 60 | 70 |
| Images | 5% | 20 | 40 | 60 |
| **Weighted Total** | **100%** | **~16** | **~58** | **~68** |

Build verified: `next build` passes cleanly (37 static pages, 3 dynamic routes).
