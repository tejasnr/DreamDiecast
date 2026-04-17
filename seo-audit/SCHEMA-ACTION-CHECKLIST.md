# Schema Action Checklist - DreamDiecast

**Date:** April 17, 2026
**Priority Order:** Critical → High → Medium → Low

---

## CRITICAL - Fix Store Schema (15 minutes)

### Issue
Homepage uses `@type: "Store"` which is for physical retail locations. This creates conflict with Organization schema and may confuse search engines.

### Solution
Change to `OnlineStore` or remove (Organization schema is sufficient).

### File to Edit
`/app/page.tsx` (lines 8-27)

### Current Code
```typescript
<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': 'Store',  // ← CHANGE THIS
    name: 'DreamDiecast',
    // ...
  }}
/>
```

### New Code Option 1 (Recommended)
```typescript
<JsonLd
  data={{
    '@context': 'https://schema.org',
    '@type': ['Organization', 'OnlineStore'],  // ← Multi-type
    name: 'DreamDiecast',
    description: "DreamDiecast is India's premier online store for premium diecast car collectibles...",
    url: SITE_URL,
    image: `${SITE_URL}/og-image.png`,
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      addressCountry: 'IN',
    },
  }}
/>
```

### New Code Option 2 (Alternative)
Remove the Store schema entirely since Organization schema already exists in root layout.

```typescript
// Remove the entire JsonLd component from page.tsx
// Organization schema in layout.tsx is sufficient
```

### Testing
1. View source on https://dreamdiecast.in/
2. Search for `application/ld+json`
3. Verify Organization schema exists (from layout.tsx)
4. Verify Store/OnlineStore schema is corrected or removed
5. Test at https://search.google.com/test/rich-results

---

## HIGH - Add Brand Schema (1-2 hours)

### Issue
Brand pages have BreadcrumbList and CollectionPage but no Brand entity schema.

### Solution
Create BrandJsonLd component and add to brand pages.

### Step 1: Add Component to JsonLd.tsx

**File:** `/components/JsonLd.tsx`

**Add this at the end (after FAQJsonLd):**

```typescript
export function BrandJsonLd({
  name,
  logo,
  description,
  url,
}: {
  name: string;
  logo?: string;
  description: string;
  url: string;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Brand',
        name,
        ...(logo && { logo }),
        description,
        url,
      }}
    />
  );
}
```

### Step 2: Use in Brand Detail Pages

**File:** `/app/brands/[slug]/page.tsx`

**Import the component (line 4):**
```typescript
import { BreadcrumbJsonLd, CollectionPageJsonLd, BrandJsonLd } from '@/components/JsonLd';
```

**Add to the JSX (after CollectionPageJsonLd, around line 59):**
```typescript
export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);
  const seo = BRAND_SEO[slug];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Brands', url: `${SITE_URL}/brands` },
          { name: brand?.name || slug, url: `${SITE_URL}/brands/${slug}` },
        ]}
      />
      <CollectionPageJsonLd
        name={seo?.title || `${brand?.name || slug} Diecast Models`}
        description={seo?.description || `Shop ${brand?.name || slug} diecast models at DreamDiecast India.`}
        url={`${SITE_URL}/brands/${slug}`}
      />

      {/* ADD THIS BLOCK */}
      {brand && (
        <BrandJsonLd
          name={brand.name}
          logo={brand.logo}
          description={seo?.description || brand.description}
          url={`${SITE_URL}/brands/${slug}`}
        />
      )}

      <BrandDetailClient />
    </>
  );
}
```

### Step 3: Import BRANDS Constant

**Check if this import exists (should be on line 2):**
```typescript
import { BRANDS } from '@/lib/brands';
```

If not, add it.

### Testing
1. Visit https://dreamdiecast.in/brands/hotwheels
2. View page source
3. Search for `"@type": "Brand"`
4. Verify brand data is correct
5. Test at https://validator.schema.org/

---

## HIGH - Add itemCondition to Product Offers (30 minutes)

### Issue
Product condition is only in `additionalProperty`, not in the offer itself. Google expects `itemCondition` in Offer schema.

### Solution
Map product condition to Schema.org ItemCondition enum.

### File to Edit
`/app/products/[slug]/page.tsx` (around line 75)

### Current Code
```typescript
offers: {
  '@type': 'Offer',
  url: `https://dreamdiecast.in/products/${slug}`,
  priceCurrency: 'INR',
  price: product.price,
  availability,
  seller: {
    '@type': 'Organization',
    name: 'DreamDiecast',
  },
},
```

### New Code
```typescript
offers: {
  '@type': 'Offer',
  url: `https://dreamdiecast.in/products/${slug}`,
  priceCurrency: 'INR',
  price: product.price,
  availability,
  itemCondition: product.condition?.toLowerCase() === 'used'
    ? 'https://schema.org/UsedCondition'
    : 'https://schema.org/NewCondition',
  seller: {
    '@type': 'Organization',
    name: 'DreamDiecast',
  },
},
```

### Testing
1. Visit any product page
2. View page source
3. Find the Product schema
4. Verify `itemCondition` exists in offers
5. Check value is `https://schema.org/NewCondition` or `UsedCondition`

---

## MEDIUM - Add priceValidUntil to Product Offers (30 minutes)

### Issue
Product prices don't have expiration dates, which Google recommends for better price tracking.

### Solution
Set priceValidUntil to 30 days from today.

### File to Edit
`/app/products/[slug]/page.tsx` (around line 75)

### Current Code
```typescript
offers: {
  '@type': 'Offer',
  url: `https://dreamdiecast.in/products/${slug}`,
  priceCurrency: 'INR',
  price: product.price,
  availability,
  itemCondition: product.condition?.toLowerCase() === 'used'
    ? 'https://schema.org/UsedCondition'
    : 'https://schema.org/NewCondition',
  seller: {
    '@type': 'Organization',
    name: 'DreamDiecast',
  },
},
```

### New Code
```typescript
offers: {
  '@type': 'Offer',
  url: `https://dreamdiecast.in/products/${slug}`,
  priceCurrency: 'INR',
  price: product.price,
  priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0], // 30 days from now in YYYY-MM-DD format
  availability,
  itemCondition: product.condition?.toLowerCase() === 'used'
    ? 'https://schema.org/UsedCondition'
    : 'https://schema.org/NewCondition',
  seller: {
    '@type': 'Organization',
    name: 'DreamDiecast',
  },
},
```

### Testing
1. Visit any product page
2. View page source
3. Find the Product schema
4. Verify `priceValidUntil` exists in offers
5. Check date is ~30 days in the future (format: YYYY-MM-DD)

---

## MEDIUM - Add Shipping Details to Product Offers (1-2 hours)

### Issue
Product offers don't include shipping information, which helps Google Shopping and Merchant Center.

### Solution
Add OfferShippingDetails with shipping rates and delivery times.

### File to Edit
`/app/products/[slug]/page.tsx` (around line 75)

### Current Code
```typescript
offers: {
  '@type': 'Offer',
  url: `https://dreamdiecast.in/products/${slug}`,
  priceCurrency: 'INR',
  price: product.price,
  priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0],
  availability,
  itemCondition: product.condition?.toLowerCase() === 'used'
    ? 'https://schema.org/UsedCondition'
    : 'https://schema.org/NewCondition',
  seller: {
    '@type': 'Organization',
    name: 'DreamDiecast',
  },
},
```

### New Code
```typescript
offers: {
  '@type': 'Offer',
  url: `https://dreamdiecast.in/products/${slug}`,
  priceCurrency: 'INR',
  price: product.price,
  priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0],
  availability,
  itemCondition: product.condition?.toLowerCase() === 'used'
    ? 'https://schema.org/UsedCondition'
    : 'https://schema.org/NewCondition',
  seller: {
    '@type': 'Organization',
    name: 'DreamDiecast',
  },
  shippingDetails: {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: product.price >= 2000 ? 0 : 99,
      currency: 'INR',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'IN',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 2,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 3,
        maxValue: 7,
        unitCode: 'DAY',
      },
    },
  },
},
```

### Notes
- Free shipping threshold: ₹2,000 (update if policy changes)
- Standard shipping: ₹99 (update if policy changes)
- Handling time: 1-2 days (update if different)
- Transit time: 3-7 days (update based on shipping policy)

### Testing
1. Visit any product page
2. View page source
3. Find the Product schema
4. Verify `shippingDetails` exists in offers
5. Check values match your shipping policy
6. Test at https://validator.schema.org/

---

## MEDIUM - Enhance CollectionPage with ItemList (2-3 hours)

### Issue
CollectionPage schema doesn't include the actual products in the collection.

### Solution
Create enhanced CollectionPage component that includes first 10-20 products.

### Step 1: Update CollectionPageJsonLd Component

**File:** `/components/JsonLd.tsx`

**Replace existing CollectionPageJsonLd (lines 86-113) with:**

```typescript
export function CollectionPageJsonLd({
  name,
  description,
  url,
  numberOfItems,
  products,
}: {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
  products?: Array<{
    name: string;
    url: string;
    image: string;
    price: number;
    availability: string;
  }>;
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
        ...(products && products.length > 0 && {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: products.length,
            itemListElement: products.map((product, index) => ({
              '@type': 'Product',
              position: index + 1,
              name: product.name,
              url: product.url,
              image: product.image,
              offers: {
                '@type': 'Offer',
                priceCurrency: 'INR',
                price: product.price,
                availability: product.availability,
              },
            })),
          },
        }),
      }}
    />
  );
}
```

### Step 2: Update Collection Pages to Pass Products

**Example for Products Page (`/app/products/page.tsx`):**

This requires fetching products data and passing first 10-20 to the component:

```typescript
// You'll need to fetch products in the page component
// Then pass to CollectionPageJsonLd:

<CollectionPageJsonLd
  name="All Diecast Models"
  description="Browse our complete collection of premium 1/64 scale diecast models from top brands worldwide."
  url={`${SITE_URL}/products`}
  numberOfItems={totalProducts}  // if available
  products={products.slice(0, 10).map(p => ({
    name: p.name,
    url: `${SITE_URL}/products/${p.slug}`,
    image: p.image,
    price: p.price,
    availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  }))}
/>
```

### Note
This requires Server Component data fetching. If you want to keep pages as Server Components, you'll need to fetch products at the page level, not in the client component.

### Testing
1. Visit collection page (e.g., /products)
2. View page source
3. Find CollectionPage schema
4. Verify `mainEntity` with `ItemList` exists
5. Check first 10 products are included

---

## LOW - Add datePublished to Reviews (15 minutes)

### Issue
Review schema doesn't include publication date, which helps with freshness signals.

### Solution
Add `datePublished` to each review.

### File to Edit
`/app/products/[slug]/page.tsx` (around line 100)

### Current Code
```typescript
schema.review = product.reviews.map((r) => ({
  '@type': 'Review',
  author: { '@type': 'Person', name: r.user },
  reviewRating: { '@type': 'Rating', ratingValue: r.rating },
  reviewBody: r.comment,
}));
```

### New Code
```typescript
schema.review = product.reviews.map((r) => ({
  '@type': 'Review',
  author: { '@type': 'Person', name: r.user },
  datePublished: r.createdAt
    ? new Date(r.createdAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0],
  reviewRating: { '@type': 'Rating', ratingValue: r.rating },
  reviewBody: r.comment,
}));
```

### Note
This assumes your review object has a `createdAt` field. If not, you may need to add it to your database schema first.

### Testing
1. Visit product page with reviews
2. View page source
3. Find Review schema
4. Verify `datePublished` exists in each review
5. Check format is YYYY-MM-DD

---

## TESTING CHECKLIST

After implementing changes, test each page:

### Homepage
- [ ] View source → Find Organization schema (from layout)
- [ ] View source → Find WebSite schema (from layout)
- [ ] View source → Find Store/OnlineStore schema (from page)
- [ ] Test at https://search.google.com/test/rich-results
- [ ] No errors or warnings

### Product Page
- [ ] View source → Find Product schema
- [ ] View source → Find BreadcrumbList schema
- [ ] Verify offers.itemCondition exists
- [ ] Verify offers.priceValidUntil exists
- [ ] Verify offers.shippingDetails exists (if implemented)
- [ ] Test at https://search.google.com/test/rich-results
- [ ] No errors or warnings

### Brand Page
- [ ] View source → Find Brand schema
- [ ] View source → Find BreadcrumbList schema
- [ ] View source → Find CollectionPage schema
- [ ] Test at https://validator.schema.org/
- [ ] No errors or warnings

### Collection Pages
- [ ] View source → Find CollectionPage schema
- [ ] View source → Find BreadcrumbList schema
- [ ] Verify mainEntity.ItemList exists (if implemented)
- [ ] Test at https://validator.schema.org/

### About Page
- [ ] View source → Find FAQPage schema
- [ ] View source → Find BreadcrumbList schema
- [ ] Verify all 6 FAQ items present
- [ ] Test at https://validator.schema.org/

---

## VALIDATION TOOLS

### 1. Google Rich Results Test
**URL:** https://search.google.com/test/rich-results
**Use for:** Product, Organization, BreadcrumbList
**Tests:** Google-specific rich result eligibility

### 2. Schema.org Validator
**URL:** https://validator.schema.org/
**Use for:** All schema types
**Tests:** Schema.org compliance

### 3. Google Search Console
**URL:** https://search.google.com/search-console
**Use for:** Live site monitoring
**Check:** Enhancements → Products, Breadcrumbs

### 4. View Page Source
**How:** Right-click → View Page Source (or Ctrl+U / Cmd+Option+U)
**Search for:** `application/ld+json`
**Verify:** All expected schema blocks present

---

## PRIORITY TIMELINE

### Week 1 (This Week)
- [ ] CRITICAL: Fix Store schema on homepage
- [ ] Test homepage with Google Rich Results Test
- [ ] Monitor Google Search Console for errors

### Week 2
- [ ] HIGH: Add Brand schema to brand pages
- [ ] HIGH: Add itemCondition to Product offers
- [ ] Test brand pages and product pages
- [ ] Monitor Google Search Console

### Month 1
- [ ] MEDIUM: Add priceValidUntil to Product offers
- [ ] MEDIUM: Add shipping details to Product offers
- [ ] Test all product pages
- [ ] Verify no errors in Search Console

### Month 2
- [ ] MEDIUM: Enhance CollectionPage with ItemList
- [ ] LOW: Add datePublished to Reviews
- [ ] Full site schema audit
- [ ] Performance analysis (CTR, impressions)

---

## ESTIMATED EFFORT

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Fix Store schema | CRITICAL | 15 min | High |
| Add Brand schema | HIGH | 1-2 hours | High |
| Add itemCondition | HIGH | 30 min | High |
| Add priceValidUntil | MEDIUM | 30 min | Medium |
| Add shipping details | MEDIUM | 1-2 hours | Medium |
| Enhance CollectionPage | MEDIUM | 2-3 hours | Medium |
| Add datePublished | LOW | 15 min | Low |

**Total Estimated Effort:** 6-9 hours across 4-8 weeks

---

## SUCCESS METRICS

### Short-Term (1-4 Weeks)
- [ ] All schema validated without errors
- [ ] Product rich results eligible
- [ ] Breadcrumb rich snippets appear
- [ ] No errors in Google Search Console

### Medium-Term (1-3 Months)
- [ ] Product rich results showing in SERP
- [ ] Organization Knowledge Panel consideration
- [ ] 10-30% improvement in organic CTR
- [ ] Increased AI/LLM citations

### Long-Term (3-6 Months)
- [ ] Shopping Graph integration
- [ ] Merchant Center feed enhanced
- [ ] Competitive advantage in organic search
- [ ] Measurable traffic increase from rich results

---

**Checklist Prepared By:** Schema.org Specialist Agent
**Date:** April 17, 2026
**Status:** Ready for Implementation
