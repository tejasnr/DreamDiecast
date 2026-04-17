# Schema.org Structured Data Audit - DreamDiecast

**Audit Date:** April 17, 2026
**Website:** https://dreamdiecast.in/
**Platform:** Next.js (App Router)
**Business Type:** E-commerce - Premium Diecast Collectibles

---

## Executive Summary

**Current State:** NO structured data detected across the entire website.

**Impact:**
- Missing eligibility for Google Rich Results (Product, Organization, Breadcrumb)
- Reduced search visibility and CTR potential
- Lost opportunities for enhanced SERP features
- Limited discoverability by AI systems (ChatGPT, Perplexity, Gemini)

**Priority:** CRITICAL - Implementation needed immediately for competitive advantage and enhanced search presence.

---

## 1. EXISTING SCHEMA DETECTION

### Findings

**Result:** NO schema markup found on any pages.

**Pages Analyzed:**
- `/` (Homepage)
- `/about`
- `/products`
- `/brands`
- `/brands/[slug]` (Dynamic brand pages)
- `/new-arrivals`
- `/pre-orders` (The Vault)
- `/bundles`
- `/shipping-policy`
- `/returns`
- `/privacy`

**Methods Checked:**
- JSON-LD (None found)
- Microdata (None found)
- RDFa (None found)

---

## 2. RECOMMENDED SCHEMA IMPLEMENTATIONS

### Priority 1: CRITICAL (Implement First)

#### A. Organization Schema (Site-wide)
**Location:** Root layout (`/app/layout.tsx`)
**Why:** Establishes brand identity, contact information, and social profiles across all pages.

**JSON-LD Template:**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DreamDiecast",
  "alternateName": "Dream Diecast",
  "url": "https://dreamdiecast.in",
  "logo": "https://dreamdiecast.in/logo.png",
  "description": "India's premier destination for premium diecast car collectibles. Curated selection from top manufacturers worldwide.",
  "email": "dreamdiecast@gmail.com",
  "telephone": "+91-91487-24708",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Bangalore",
    "addressRegion": "Karnataka",
    "addressCountry": "IN"
  },
  "sameAs": [
    "https://www.instagram.com/dreamdiecastofficial/",
    "https://chat.whatsapp.com/BvgtaCooKYpJpsfDo978Fy"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+91-91487-24708",
    "contactType": "customer service",
    "email": "dreamdiecast@gmail.com",
    "availableLanguage": "English"
  }
}
```

---

#### B. WebSite with SearchAction (Homepage)
**Location:** Homepage (`/app/page.tsx`)
**Why:** Enables Google Sitelinks Search Box in SERP.

**JSON-LD Template:**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "DreamDiecast",
  "url": "https://dreamdiecast.in",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://dreamdiecast.in/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**Note:** Update `urlTemplate` once search functionality is implemented.

---

#### C. Product Schema (Product Detail Modal)
**Location:** Product detail pages/modal (`/components/ProductDetailModal.tsx`)
**Why:** Critical for Google Product Rich Results, Shopping Graph, and Merchant Center integration.

**JSON-LD Template (In-Stock Products):**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Product Name]",
  "description": "[Product Description]",
  "image": [
    "[Image URL 1]",
    "[Image URL 2]",
    "[Image URL 3]"
  ],
  "brand": {
    "@type": "Brand",
    "name": "[Brand Name]"
  },
  "sku": "[Product SKU]",
  "mpn": "[Manufacturer Part Number if available]",
  "category": "[Product Category]",
  "offers": {
    "@type": "Offer",
    "url": "https://dreamdiecast.in/products/[slug]",
    "priceCurrency": "INR",
    "price": "[Price]",
    "priceValidUntil": "[Date +30 days from now]",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "DreamDiecast"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "[Average Rating]",
    "reviewCount": "[Number of Reviews]",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "[Reviewer Name]"
      },
      "datePublished": "[ISO 8601 Date]",
      "reviewBody": "[Review Text]",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "[Rating]",
        "bestRating": "5",
        "worstRating": "1"
      }
    }
  ],
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Scale",
      "value": "[Scale e.g., 1:64]"
    },
    {
      "@type": "PropertyValue",
      "name": "Type",
      "value": "[Type e.g., Diecast]"
    },
    {
      "@type": "PropertyValue",
      "name": "Condition",
      "value": "[Condition]"
    }
  ]
}
```

**JSON-LD Template (Pre-Order Products):**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Product Name]",
  "description": "[Product Description]",
  "image": ["[Image URLs]"],
  "brand": {
    "@type": "Brand",
    "name": "[Brand Name]"
  },
  "sku": "[Product SKU]",
  "category": "[Product Category]",
  "offers": {
    "@type": "Offer",
    "url": "https://dreamdiecast.in/products/[slug]",
    "priceCurrency": "INR",
    "price": "[Total Final Price]",
    "priceValidUntil": "[ETA Date]",
    "availability": "https://schema.org/PreOrder",
    "availabilityStarts": "[ETA Date ISO 8601]",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "DreamDiecast"
    },
    "advanceBookingRequirement": {
      "@type": "QuantitativeValue",
      "value": "[Booking Advance Amount]",
      "unitCode": "INR"
    }
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Scale",
      "value": "[Scale]"
    },
    {
      "@type": "PropertyValue",
      "name": "ETA",
      "value": "[ETA Display String]"
    }
  ]
}
```

**JSON-LD Template (Out of Stock Products):**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Product Name]",
  "description": "[Product Description]",
  "image": ["[Image URLs]"],
  "brand": {
    "@type": "Brand",
    "name": "[Brand Name]"
  },
  "sku": "[Product SKU]",
  "offers": {
    "@type": "Offer",
    "url": "https://dreamdiecast.in/products/[slug]",
    "priceCurrency": "INR",
    "price": "[Price]",
    "availability": "https://schema.org/OutOfStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "DreamDiecast"
    }
  }
}
```

**Implementation Notes:**
- Include all product images in the `image` array (critical for Google Merchant Center)
- Always use absolute URLs
- Use ISO 8601 format for dates
- Include `aggregateRating` only if `reviewCount >= 1`
- Map product stock status to correct Schema.org availability values:
  - In Stock: `https://schema.org/InStock`
  - Out of Stock: `https://schema.org/OutOfStock`
  - Pre-Order: `https://schema.org/PreOrder`
  - Limited Stock: `https://schema.org/LimitedAvailability`

---

#### D. BreadcrumbList (All Pages Except Homepage)
**Location:** All collection and detail pages
**Why:** Helps Google understand site hierarchy and displays breadcrumb rich snippets.

**JSON-LD Template (Example: Brand Page):**

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
      "name": "[Brand Name]",
      "item": "https://dreamdiecast.in/brands/[slug]"
    }
  ]
}
```

**Pages Requiring Breadcrumbs:**
- `/brands` → Home > Brands
- `/brands/[slug]` → Home > Brands > [Brand Name]
- `/new-arrivals` → Home > New Arrivals
- `/pre-orders` → Home > Pre-Orders
- `/bundles` → Home > Bundles
- `/products` → Home > All Models
- `/about` → Home > About
- `/shipping-policy` → Home > Shipping Policy
- `/returns` → Home > Returns & Refunds
- `/privacy` → Home > Privacy Policy

---

### Priority 2: HIGH (Implement Second)

#### E. CollectionPage (Category/Collection Pages)
**Location:** `/app/products/page.tsx`, `/app/new-arrivals/page.tsx`, `/app/pre-orders/page.tsx`, `/app/bundles/page.tsx`, `/app/brands/[slug]/page.tsx`
**Why:** Helps search engines understand the structure of product collections.

**JSON-LD Template:**

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "[Collection Name e.g., 'Hot Wheels Collectibles']",
  "description": "[Collection Description]",
  "url": "https://dreamdiecast.in/[collection-path]",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": "[Total Products Count]",
    "itemListElement": [
      {
        "@type": "Product",
        "position": 1,
        "name": "[Product Name]",
        "url": "https://dreamdiecast.in/products/[slug]",
        "image": "[Image URL]",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": "[Price]",
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  }
}
```

**Implementation Notes:**
- Include first 10-20 products in `itemListElement`
- Use pagination properties if implementing pagination:
  ```json
  "potentialAction": {
    "@type": "ViewAction",
    "target": "https://dreamdiecast.in/[collection]?page={page_number}"
  }
  ```

---

#### F. Brand Schema (Brand Pages)
**Location:** `/app/brands/[slug]/page.tsx`
**Why:** Establishes brand entities for each manufacturer.

**JSON-LD Template:**

```json
{
  "@context": "https://schema.org",
  "@type": "Brand",
  "name": "[Brand Name]",
  "logo": "https://dreamdiecast.in/assets/[brand-logo].png",
  "description": "[Brand Description]",
  "url": "https://dreamdiecast.in/brands/[slug]",
  "slogan": "[Brand Tagline]"
}
```

**Brands to Implement:**
1. Hot Wheels
2. Bburago
3. Mini GT
4. Pop Race
5. Tarmac Works
6. Matchbox
7. Poster Cars
8. Other brands (from dynamic data)

---

### Priority 3: MEDIUM (Implement After Core Schema)

#### G. LocalBusiness Schema (If Applicable)
**Status:** INFO - Evaluate based on business model
**Consideration:** Only implement if physical retail location exists or local pickup is offered.

**Current Business Model:** Online-only e-commerce
**Recommendation:** NOT RECOMMENDED at this time. Organization schema is sufficient.

**If Future Physical Location Opens:**

```json
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "DreamDiecast",
  "image": "https://dreamdiecast.in/store-front.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[Street Address]",
    "addressLocality": "Bangalore",
    "addressRegion": "Karnataka",
    "postalCode": "[Postal Code]",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[Latitude]",
    "longitude": "[Longitude]"
  },
  "url": "https://dreamdiecast.in",
  "telephone": "+91-91487-24708",
  "email": "dreamdiecast@gmail.com",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "10:00",
      "closes": "19:00"
    }
  ]
}
```

---

#### H. FAQPage Schema
**Status:** INFO - Restricted for commercial sites
**Google Policy Update:** As of August 2023, FAQ rich results are restricted to government and healthcare websites.

**Recommendation:**
- NOT RECOMMENDED for Google rich results benefit
- MAY still provide value for:
  - AI/LLM citations (ChatGPT, Perplexity, Gemini)
  - Voice search optimization
  - Knowledge graph building

**If Implementing for AI Discoverability:**

**Location:** Create `/app/faq/page.tsx`

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is your shipping policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We ship across India with secure packaging. Delivery typically takes 3-7 business days depending on location. Free shipping on orders above ₹2,000."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer international shipping?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Currently, we ship within India only. International shipping is coming soon."
      }
    },
    {
      "@type": "Question",
      "name": "What is the return policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We accept returns within 7 days of delivery for unopened items in original condition. See our Returns & Refunds policy for complete details."
      }
    },
    {
      "@type": "Question",
      "name": "Are all models authentic?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we source directly from authorized distributors and manufacturers. Every model is guaranteed authentic."
      }
    }
  ]
}
```

---

## 3. SCHEMA TYPES TO AVOID

### Deprecated / Removed by Google

#### HowTo Schema
**Status:** DEPRECATED
**Removed:** September 2023
**Reason:** Google discontinued rich results support
**Action:** DO NOT IMPLEMENT

---

#### SpecialAnnouncement Schema
**Status:** DEPRECATED
**Removed:** July 31, 2025
**Reason:** COVID-19-specific schema type discontinued
**Action:** DO NOT IMPLEMENT

---

#### Course-Related Schemas
**Deprecated Types:**
- `CourseInfo`
- `EstimatedSalary`
- `LearningVideo`

**Retired:** June 2025
**Action:** DO NOT IMPLEMENT (Not applicable to diecast e-commerce)

---

## 4. IMPLEMENTATION GUIDE

### A. Next.js Implementation Pattern

**Recommended Approach:** JSON-LD script tags in components/pages

**Example: Organization Schema in Root Layout**

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DreamDiecast",
    "url": "https://dreamdiecast.in",
    // ... rest of schema
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

**Example: Product Schema in Product Modal**

```tsx
// components/ProductDetailModal.tsx
export default function ProductDetailModal({ product }: Props) {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images || [product.image],
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "sku": product.sku,
    "offers": {
      "@type": "Offer",
      "url": `https://dreamdiecast.in/products/${product.id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    // Include aggregateRating only if reviews exist
    ...(product.reviews && product.reviews.length > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviews.length
      }
    })
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {/* Modal content */}
    </>
  );
}
```

---

### B. Validation Checklist

Before deploying, verify each schema block:

- [ ] `@context` is `"https://schema.org"` (not http)
- [ ] `@type` is valid and not deprecated
- [ ] All required properties are present
- [ ] Property values match expected types
- [ ] No placeholder text (e.g., "[Business Name]")
- [ ] All URLs are absolute (start with https://)
- [ ] All dates are in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
- [ ] Currency codes use ISO 4217 (INR for Indian Rupees)
- [ ] Images use absolute URLs and are accessible
- [ ] No syntax errors (valid JSON)

---

### C. Testing Tools

**1. Google Rich Results Test**
- URL: https://search.google.com/test/rich-results
- Test each page type (homepage, product, collection, brand)
- Verify no errors or warnings

**2. Schema.org Validator**
- URL: https://validator.schema.org/
- Paste JSON-LD or enter URL
- Verify schema structure

**3. Google Search Console**
- Monitor "Enhancements" section after deployment
- Check for Product, Breadcrumb, Organization errors
- Review "Coverage" for indexed pages with rich results

**4. Chrome DevTools**
- Inspect page source
- Find `<script type="application/ld+json">` tags
- Copy JSON and validate at validator.schema.org

---

## 5. PRODUCT DATA MAPPING

### From Convex Schema to Schema.org

**Convex Product Schema Fields → Schema.org Mapping:**

| Convex Field | Schema.org Property | Notes |
|--------------|-------------------|-------|
| `name` | `name` | Direct mapping |
| `description` | `description` | Direct mapping |
| `image` / `images` | `image` | Use array if multiple images |
| `brand` | `brand.name` | Nest in Brand object |
| `price` | `offers.price` | For in-stock products |
| `bookingAdvance` | `offers.price` | For pre-order products (deposit) |
| `totalFinalPrice` | Additional property or description | Full price for pre-orders |
| `sku` | `sku` | Direct mapping |
| `scale` | `additionalProperty` | Custom property |
| `type` | `additionalProperty` | Custom property |
| `condition` | `offers.itemCondition` | Map to Schema.org ItemCondition |
| `specialFeatures` | `description` or `additionalProperty` | Append or nest |
| `stock` | `offers.availability` | Map to availability enum |
| `listingType` | `offers.availability` | pre-order → PreOrder |
| `rating` | `aggregateRating.ratingValue` | Include if reviews exist |
| `reviews` | `review` array | Map each review object |
| `eta` | `offers.availabilityStarts` | Convert to ISO 8601 |

**Stock Status Mapping:**

| Convex Condition | Schema.org Availability |
|------------------|-------------------------|
| `stock > 0` and `listingType !== 'pre-order'` | `https://schema.org/InStock` |
| `stock <= 0` and `listingType !== 'pre-order'` | `https://schema.org/OutOfStock` |
| `listingType === 'pre-order'` | `https://schema.org/PreOrder` |
| `stock > 0 && stock <= 5` | `https://schema.org/LimitedAvailability` |

**Condition Mapping:**

| Convex Condition | Schema.org ItemCondition |
|------------------|--------------------------|
| "New" or "new" | `https://schema.org/NewCondition` |
| "Used" or "used" | `https://schema.org/UsedCondition` |
| Not specified | `https://schema.org/NewCondition` (default) |

---

## 6. IMPLEMENTATION PRIORITY & TIMELINE

### Phase 1: Foundation (Week 1)
**Priority:** CRITICAL
**Effort:** 8-12 hours

- [ ] Organization schema (root layout)
- [ ] WebSite with SearchAction (homepage)
- [ ] BreadcrumbList component (reusable)
- [ ] Basic Product schema (in-stock only)

**Expected Impact:**
- Organization Knowledge Panel eligibility
- Breadcrumb rich snippets
- Product rich results for in-stock items

---

### Phase 2: Product Coverage (Week 2)
**Priority:** HIGH
**Effort:** 6-8 hours

- [ ] Product schema for pre-orders
- [ ] Product schema for out-of-stock
- [ ] AggregateRating (if reviews present)
- [ ] Individual Review schema
- [ ] Product images array

**Expected Impact:**
- Full product catalog rich results
- Star ratings in SERP
- Enhanced product detail visibility

---

### Phase 3: Collections & Brands (Week 3)
**Priority:** HIGH
**Effort:** 4-6 hours

- [ ] CollectionPage for all category pages
- [ ] Brand schema for brand pages
- [ ] ItemList for product collections
- [ ] Dynamic breadcrumbs for all pages

**Expected Impact:**
- Better collection page indexing
- Brand entity recognition
- Improved site hierarchy understanding

---

### Phase 4: Optimization (Week 4)
**Priority:** MEDIUM
**Effort:** 2-4 hours

- [ ] Add product availability dates
- [ ] Include manufacturer part numbers (if available)
- [ ] Optimize image arrays
- [ ] Add shipping details to offers
- [ ] Implement priceValidUntil logic

**Expected Impact:**
- Enhanced product data quality
- Better Merchant Center integration
- Improved Shopping Graph visibility

---

## 7. MONITORING & MAINTENANCE

### Post-Implementation Checklist

**Week 1 After Launch:**
- [ ] Verify schema appears in page source (view-source:)
- [ ] Test 5-10 pages with Google Rich Results Test
- [ ] Check for errors in Google Search Console
- [ ] Monitor structured data reports

**Monthly:**
- [ ] Review Search Console Enhancements reports
- [ ] Check for new schema errors/warnings
- [ ] Verify product schema on new listings
- [ ] Update Organization schema if business details change

**Quarterly:**
- [ ] Audit schema coverage across site
- [ ] Review Google's schema.org documentation for updates
- [ ] Check for deprecated schema types
- [ ] Optimize based on Search Console insights

---

## 8. COMMON PITFALLS TO AVOID

### Critical Errors

1. **Using HTTP instead of HTTPS in @context**
   - WRONG: `"@context": "http://schema.org"`
   - RIGHT: `"@context": "https://schema.org"`

2. **Relative URLs instead of Absolute**
   - WRONG: `"url": "/products/abc"`
   - RIGHT: `"url": "https://dreamdiecast.in/products/abc"`

3. **Missing Required Properties**
   - Product MUST have: `name`, `image`, `offers`
   - Offer MUST have: `price`, `priceCurrency`, `availability`

4. **Incorrect Date Format**
   - WRONG: `"2026-04-17"` (acceptable) or `"17/04/2026"` (WRONG)
   - RIGHT: `"2026-04-17"` or `"2026-04-17T10:30:00+05:30"` (ISO 8601)

5. **Including AggregateRating Without Reviews**
   - Only include `aggregateRating` if `reviewCount >= 1`
   - Google will flag as error if no reviews exist

6. **Placeholder Text in Production**
   - NEVER deploy with `[Business Name]` or `[Product Name]`
   - Always use actual values from database/props

7. **Inconsistent Availability Values**
   - WRONG: `"availability": "in-stock"`
   - RIGHT: `"availability": "https://schema.org/InStock"`

8. **Missing Seller Information**
   - Always include `seller` in Offer:
     ```json
     "seller": {
       "@type": "Organization",
       "name": "DreamDiecast"
     }
     ```

---

## 9. EXPECTED RESULTS

### Short-Term (1-4 weeks)
- Schema validated and indexed by Google
- Breadcrumb rich snippets appear in SERP
- Organization Knowledge Panel consideration

### Medium-Term (1-3 months)
- Product rich results (price, availability, ratings)
- Enhanced SERP CTR (estimated +10-30%)
- Improved product discoverability
- AI/LLM citation eligibility

### Long-Term (3-6 months)
- Shopping Graph integration
- Merchant Center feed enhancement
- Knowledge Panel establishment
- Competitive advantage in organic search

---

## 10. ADDITIONAL RESOURCES

### Official Documentation
- Schema.org: https://schema.org/
- Google Search Central - Structured Data: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Product Structured Data: https://developers.google.com/search/docs/appearance/structured-data/product

### Validation Tools
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/
- Google Search Console: https://search.google.com/search-console

### Next.js Resources
- Next.js Metadata API: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- Next.js JSON-LD: https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld

---

## 11. CONCLUSION

**Current State:** Zero structured data implementation
**Risk Level:** HIGH - Missing critical SEO and discoverability opportunities
**Recommended Action:** Immediate implementation of Phase 1 (Organization, WebSite, Product, BreadcrumbList)

**Estimated Total Implementation Time:** 20-30 hours across 4 weeks
**Expected ROI:** High - Enhanced search visibility, improved CTR, rich result eligibility, AI discoverability

**Next Steps:**
1. Review and approve this audit document
2. Prioritize Phase 1 implementation
3. Create reusable schema components for Next.js
4. Implement schema on highest-traffic pages first
5. Validate with Google Rich Results Test
6. Deploy and monitor in Google Search Console

---

**Audit Prepared By:** Schema.org Specialist (Claude Agent)
**Review Date:** April 17, 2026
**Next Review:** July 17, 2026 (3 months post-implementation)
