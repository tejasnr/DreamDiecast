# Brand-Based Category Browsing

## Overview

Restructure DreamDiecast's navigation and browsing experience from **availability-based** (Pre-Orders, Current Stock, New Arrivals, Bundles) to a **brand-first** model where users shop by diecast brand, with availability as a secondary filter. This aligns with how diecast collectors actually think — they're loyal to brands first, availability second.

---

## UX Rationale

**Why brand-first?**
- Diecast collectors identify strongly with brands (Hot Wheels vs MiniGT vs Bburago are different communities)
- "Current Stock" is a filter, not a destination — every brand page implicitly shows what's in stock
- Brand pages create richer browsing experiences with brand identity and storytelling
- Reduces nav clutter while increasing discoverability

**UI/UX Style (per ui-ux-pro-max):**
- Product type: **E-commerce Luxury** (Row 4) + **Automotive/Car Dealership** (Row 54)
- Primary style: **Liquid Glass + Glassmorphism** with **Motion-Driven + 3D Hyperrealism** accents
- Landing pattern: **Feature-Rich Showcase**
- Color palette: Existing dark theme (`#050505` bg, `#F27D26` accent) + per-brand accent colors
- Key consideration: "Elegance & sophistication. Premium materials. Vehicle showcase. High-quality imagery."

---

## Navigation Restructure

### Before (4 items)
```
Pre-Orders | Current Stock | New Arrivals | Bundles
```

### After (4 items)
```
Brands | New Arrivals | Pre-Orders | Bundles
```

### Changes
| Page | Action | Reason |
|------|--------|--------|
| **Current Stock** (`/current-stock`) | **REMOVE** | Redundant — brand pages show in-stock items. "In Stock" becomes a filter chip, not a page. |
| **Pre-Orders** (`/pre-orders`) | **KEEP** | Core business feature (₹100 booking model). Collectors browse pre-orders across all brands. |
| **New Arrivals** (`/new-arrivals`) | **KEEP** | Discovery/excitement mechanism. Collectors want to see what's new across all brands. |
| **Bundles** (`/bundles`) | **KEEP** | Distinct product type with different value proposition (multi-item sets). |
| **Brands** (`/brands`) | **ADD** | New brand showcase landing page. Primary browsing entry point. |
| **Brand Detail** (`/brands/[slug]`) | **ADD** | Per-brand product listing with availability filters. |

---

## Supported Brands

| Brand | Slug | Accent Color | Logo SVG Path | Description |
|-------|------|-------------|---------------|-------------|
| Hot Wheels | `hotwheels` | `#ED1C24` (Red) | `app/assets/hotwheels.svg` | The iconic Mattel line |
| Bburago | `bburago` | `#0057B8` (Blue) | `app/assets/burago.svg` | Italian precision models |
| Mini GT | `minigt` | `#00C853` (Green) | `app/assets/mini-gt.svg` | TSM's 1:64 line |
| Pop Race | `poprace` | `#FF6D00` (Orange) | `app/assets/poprace.svg` | Hong Kong limited editions |
| Poster Cars | `postercars` | `#AB47BC` (Purple) | `app/assets/PosterCars.svg` | Artistic collector pieces |
| Matchbox | `matchbox` | `#FFD600` (Yellow) | `app/assets/matchbox.svg` | Classic Mattel line |

> **Note:** Brand values in the `products.brand` field must match these names exactly. The schema already has a `by_brand` index.
> **Note:** All brand logos are local SVGs in `app/assets/`. Import them directly (e.g., `import HotWheelsLogo from '@/app/assets/hotwheels.svg'`) or use `<Image src="/assets/hotwheels.svg" />` depending on Next.js SVG handling setup.

---

## File Structure

### New Files
```
app/
  brands/
    page.tsx                    # Brand showcase landing page
    [slug]/
      page.tsx                  # Brand detail page (products filtered by brand)

components/
  BrandGrid.tsx                 # Homepage brand showcase (replaces CategoryGrid)
  BrandCard.tsx                 # Individual brand card with logo/accent color
  BrandPage.tsx                 # Reusable brand detail page layout (like ProductPage.tsx)

lib/
  brands.ts                     # Brand config (slugs, colors, descriptions, metadata)
```

### Modified Files
```
components/Navbar.tsx           # Update nav links (replace Current Stock with Brands)
components/CategoryGrid.tsx     # REMOVE or repurpose → replaced by BrandGrid
app/page.tsx                    # Replace <CategoryGrid /> with <BrandGrid />
convex/schema.ts                # Add brand image fields to settings table
convex/settings.ts              # Add brand image getters/setters
```

### Removed Files
```
app/current-stock/page.tsx      # No longer a standalone page
```

---

## Core Architecture

### 1. Brand Configuration (`lib/brands.ts`)

```typescript
import HotWheelsLogo from '@/app/assets/hotwheels.svg';
import BburagoLogo from '@/app/assets/burago.svg';
import MiniGTLogo from '@/app/assets/mini-gt.svg';
import PopRaceLogo from '@/app/assets/poprace.svg';
import PosterCarsLogo from '@/app/assets/PosterCars.svg';
import MatchboxLogo from '@/app/assets/matchbox.svg';

export interface Brand {
  name: string;
  slug: string;
  accentColor: string;
  logo: string;          // Imported SVG asset
  description: string;
  tagline: string;       // Short subtitle for brand page header
}

export const BRANDS: Brand[] = [
  {
    name: 'Hot Wheels',
    slug: 'hotwheels',
    accentColor: '#ED1C24',
    logo: HotWheelsLogo,
    description: 'The world\'s most iconic diecast brand.',
    tagline: 'Since 1968',
  },
  {
    name: 'Bburago',
    slug: 'bburago',
    accentColor: '#0057B8',
    logo: BburagoLogo,
    description: 'Italian craftsmanship in miniature.',
    tagline: 'Precision Models',
  },
  {
    name: 'Mini GT',
    slug: 'minigt',
    accentColor: '#00C853',
    logo: MiniGTLogo,
    description: 'TSM\'s premium 1:64 scale line.',
    tagline: 'True Scale Miniatures',
  },
  {
    name: 'Pop Race',
    slug: 'poprace',
    accentColor: '#FF6D00',
    logo: PopRaceLogo,
    description: 'Limited edition Hong Kong exclusives.',
    tagline: 'Limited Runs',
  },
  {
    name: 'Poster Cars',
    slug: 'postercars',
    accentColor: '#AB47BC',
    logo: PosterCarsLogo,
    description: 'Where art meets diecast.',
    tagline: 'Collector Art',
  },
  {
    name: 'Matchbox',
    slug: 'matchbox',
    accentColor: '#FFD600',
    logo: MatchboxLogo,
    description: 'The original pocket-sized collectible.',
    tagline: 'Since 1953',
  },
];

export function getBrandBySlug(slug: string): Brand | undefined;
export function getBrandNameFromSlug(slug: string): string; // For Convex query matching
```

> **SVG Import Note:** If Next.js doesn't support direct SVG imports as components, use `@svgr/webpack` or reference them as `<Image src={brand.logo} alt={brand.name} />`. The SVGs are in `app/assets/` — ensure the import path resolves correctly.

### 2. Brands Landing Page (`app/brands/page.tsx`)

**Layout:** 2x3 grid (desktop) → 2x3 (tablet) → 1-column stack (mobile)

Each brand card:
- Full card is clickable → navigates to `/brands/[slug]`
- **Brand SVG logo** displayed prominently in the card center/upper area (use `<Image>` with the logo from `lib/brands.ts`). Logos render in white/monochrome by default, colorize on hover via CSS `filter` or `brightness`
- Background: Brand hero image from settings (admin-uploadable) with grayscale → color on hover
- Brand accent color glow on hover (`box-shadow: 0 0 30px {accentColor}30`)
- Tagline in `font-mono` small caps below logo
- Product count badge (e.g., "12 Models") in bottom corner
- Glass overlay with gradient from bottom

**Animation:**
- Staggered fade-in on scroll (existing pattern from CategoryGrid)
- Hover: image desaturates → saturates, scale 1.05, accent glow `box-shadow`
- Transition duration: 500-700ms (matches existing design language)

### 3. Brand Detail Page (`app/brands/[slug]/page.tsx`)

**Structure:**
- Hero banner (same pattern as `ProductPage.tsx`) with brand-specific banner image
- **Brand SVG logo** displayed in the hero area (large, ~120-160px wide) alongside or above the brand name
- Brand name as page title, tagline as subtitle
- **Filter chips** below banner: `All` | `In Stock` | `Pre-Order` | `New Arrival` | `Bundle`
  - Chips use the brand's accent color when active
  - Default: `All` (shows everything for that brand)
- Product grid (same responsive grid as `ProductPage.tsx`: 1 → 2 → 3 → 4 cols)
- Uses `ProductCard` and `ProductDetailModal` (existing components)

**Data fetching:**
- Query products using existing `by_brand` index in Convex
- Client-side filter by category (for the filter chips)
- If slug doesn't match any brand → `notFound()`

### 4. Homepage BrandGrid (`components/BrandGrid.tsx`)

Replaces `CategoryGrid.tsx` on the homepage.

**Layout:** 3x2 grid (desktop) → 2x3 (tablet) → 1-col scroll (mobile)

Each card is compact (aspect `[4/3]` instead of `[3/4]`) showing:
- Brand image background (from settings, with fallback)
- **Brand SVG logo** centered on the card (white/monochrome, ~80-100px wide)
- Link to `/brands/[slug]`

**Section header:**
```
───── SHOP BY BRAND
Browse our collection by manufacturer
```

Below the BrandGrid, keep the existing 3-card quick-links row for:
- **The Vault** → `/pre-orders`
- **Fresh Drops** → `/new-arrivals`
- **Collector Sets** → `/bundles`

This gives the homepage two browse patterns: by brand (primary) and by availability type (secondary).

### 5. Convex Schema Updates (`convex/schema.ts`)

Add brand image fields to the `settings` table:

```typescript
settings: defineTable({
  key: v.string(),
  heroBackground: v.optional(v.string()),
  vaultImage: v.optional(v.string()),
  footerBackground: v.optional(v.string()),
  categoryJdm: v.optional(v.string()),
  categoryEuropean: v.optional(v.string()),
  categoryHypercars: v.optional(v.string()),
  // New brand banner images
  brandHotwheels: v.optional(v.string()),
  brandBburago: v.optional(v.string()),
  brandMinigt: v.optional(v.string()),
  brandPoprace: v.optional(v.string()),
  brandPostercars: v.optional(v.string()),
  brandMatchbox: v.optional(v.string()),
}).index("by_key", ["key"]),
```

### 6. Convex Product Query (new or extend `convex/products.ts`)

Add a query to fetch products by brand:

```typescript
export const getByBrand = query({
  args: { brand: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_brand", (q) => q.eq("brand", args.brand))
      .collect();
  },
});
```

Add a query to get product count per brand (for the brand cards):

```typescript
export const getCountByBrand = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    }
    return counts;
  },
});
```

### 7. Navbar Updates (`components/Navbar.tsx`)

**Desktop nav:**
```tsx
<Link href="/brands">Brands</Link>
<Link href="/new-arrivals">New Arrivals</Link>
<Link href="/pre-orders">Pre-Orders</Link>
<Link href="/bundles">Bundles</Link>
```

**Mobile menu:** Same order, same pattern.

**Footer:** Update "Collections" column links to include Brands page and remove Current Stock.

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid brand slug in URL | Use Next.js `notFound()` — show 404 page |
| Brand has 0 products | Show empty state: "No models available yet. Check back soon." with link back to `/brands` |
| Brand image not set in admin | Fallback to a generic diecast photo (same pattern as existing CategoryGrid fallbacks) |
| Product has brand not in `BRANDS` config | Won't appear in brand pages. Admin should use exact brand names. Consider a validation note in admin UI. |
| `/current-stock` URL still accessed (bookmarks, SEO) | Add a redirect from `/current-stock` → `/brands` in `next.config.ts` redirects |
| Filter chip selected but 0 results | Show inline message: "No [filter] items for [Brand] right now." |

---

## Completion Criteria

- [ ] `/brands` page renders all 6 brands in a responsive grid with images, names, taglines, and product counts
- [ ] `/brands/[slug]` page renders all products for the selected brand with working filter chips (All, In Stock, Pre-Order, New Arrival, Bundle)
- [ ] Navbar updated: `Brands | New Arrivals | Pre-Orders | Bundles` (desktop + mobile)
- [ ] Homepage: `BrandGrid` replaces old `CategoryGrid`, with secondary row for Vault/Fresh Drops/Collector Sets
- [ ] Footer links updated
- [ ] `/current-stock` redirects to `/brands`
- [ ] Convex schema updated with brand image fields
- [ ] Convex queries for `getByBrand` and `getCountByBrand` work correctly
- [ ] Invalid brand slugs show 404
- [ ] Empty brand states handled gracefully
- [ ] All existing functionality (cart, pre-order booking, checkout) unaffected
- [ ] Animations match existing design language (framer-motion stagger, hover effects)
- [ ] Mobile responsive at all breakpoints (320, 375, 414, 768, 1024, 1440)
