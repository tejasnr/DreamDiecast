# Image Optimization — DreamDiecast

> SEO-safe image optimization plan. No SEO overhaul regressions — all alt text, JSON-LD, metadata image references, and `next/image` usage preserved.

---

## 0. Problem Summary

The site loads oversized images and scales them down in CSS, wasting bandwidth and hurting Core Web Vitals (LCP, FCP). This impacts the Performance score in the SEO overhaul (currently ~68/100, Phase 6 targets 70).

### Current Image Inventory

| Image | Physical Size | File Size | Max Display Size | Waste |
|-------|--------------|-----------|-----------------|-------|
| `public/assets/gt3rs.jpg` | 2813×1363 | 977 KB | ~1920×930 desktop, ~350×700 mobile | Massive — 2-4× oversized |
| `public/assets/gt3rs.png` | (duplicate variant) | 663 KB | Settings fallback only | Dead weight |
| `app/assets/blue-gtr.jpg` | 2046×1882 | 660 KB | ~640×480 (1/3 of viewport) | 3× oversized |
| `app/assets/pagani.png` | 1422×1246 | **1.7 MB** | ~640×480 (1/3 of viewport) | PNG format, 2× oversized |
| `app/assets/ford.jpg` | 2046×1875 | 670 KB | ~640×480 (1/3 of viewport) | 3× oversized |
| `public/assets/hotwheels.png` | 559×447 | 30 KB | 140×80 (landing) / 100×60 (compact) | 4× oversized |
| `public/assets/mini-gt.png` | 2000×897 | 61 KB | 140×80 / 160×80 | **14× oversized** |
| `public/assets/tarmac-works.png` | 597×418 | 59 KB | 140×80 | 4× oversized |
| `public/assets/burago.png` | 666×375 | 15 KB | 140×80 | 5× oversized |
| `public/assets/matchbox.png` | 666×374 | 22 KB | 140×80 | 5× oversized |
| `public/assets/poprace.png` | 500×500 | 2.8 KB | 140×80 | Minimal (already small) |
| `public/logo.png` | 521×521 | 250 KB | 36-40px navbar | **13× oversized + `unoptimized` prop bypasses Next.js optimization** |
| `public/assets/QR.png` | 752×746 | 169 KB | 192×192 (w-48) on checkout/pay pages | 4× oversized |
| `app/assets/favicon.png` | (unknown) | **1.8 MB** | Unused duplicate | Dead weight |
| `app/assets/logo.png` | (unknown) | 343 KB | Unused duplicate | Dead weight |

**Total wasted payload: ~5+ MB of unnecessary image data**

---

## 1. Strategy — Two-Track Approach

### Track A: Resize & Convert Static Assets (Build-Time)
Create optimized versions of all static images at the sizes they actually display. Convert to WebP. Keep originals as backups in a `public/assets/originals/` folder.

### Track B: Configure Next.js Image Pipeline (Runtime)
Add `deviceSizes`, `imageSizes`, and `formats` to `next.config.ts` so the Next.js `<Image>` component serves appropriately sized images. Add `sizes` prop to all `<Image>` components for responsive hints.

### What NOT to touch (SEO safety)
- Do NOT change any `alt` text on images
- Do NOT remove any image references from JSON-LD schemas
- Do NOT change OG image metadata paths (those are separate)
- Do NOT change `priority` props on LCP images
- Do NOT remove `placeholder="blur"` from ThemeGrid images
- Keep all `<Image>` components as `<Image>` (no downgrade to `<img>`)

### Critical Finding: Navbar Logo `unoptimized` Prop

The navbar logo `<Image>` in `components/Navbar.tsx` has `unoptimized` set, which **bypasses Next.js image optimization entirely**. The full 521×521 250KB PNG is served raw to every visitor on every page. This prop must be removed as part of this optimization.

---

## 2. Phase 1 — Resize & Convert Static Assets

### 2.1 Tool: `sharp` (build script)

Create a one-time Node.js script using `sharp` to resize and convert images. Run once, commit the results, then the script can be removed.

**Install (dev dependency):**
```bash
pnpm add -D sharp
```

**Create `scripts/optimize-images.mjs`:**

```js
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OPTIMIZATIONS = [
  // Hero background — serve at 1920w max (desktop), let Next.js handle mobile via srcSet
  {
    input: 'public/assets/gt3rs.jpg',
    outputs: [
      { path: 'public/assets/gt3rs.webp', width: 1920, quality: 80 },
      { path: 'public/assets/gt3rs-mobile.webp', width: 768, quality: 75 },
    ],
  },
  // Theme grid images — max display ~640px wide at 2x = 1280px
  {
    input: 'app/assets/blue-gtr.jpg',
    outputs: [
      { path: 'app/assets/blue-gtr.webp', width: 1280, quality: 80 },
    ],
  },
  {
    input: 'app/assets/pagani.png',
    outputs: [
      { path: 'app/assets/pagani.webp', width: 1280, quality: 80 },
    ],
  },
  {
    input: 'app/assets/ford.jpg',
    outputs: [
      { path: 'app/assets/ford.webp', width: 1280, quality: 80 },
    ],
  },
  // Brand logos — max display 160px wide at 2x = 320px
  {
    input: 'public/assets/hotwheels.png',
    outputs: [
      { path: 'public/assets/hotwheels.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/mini-gt.png',
    outputs: [
      { path: 'public/assets/mini-gt.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/tarmac-works.png',
    outputs: [
      { path: 'public/assets/tarmac-works.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/burago.png',
    outputs: [
      { path: 'public/assets/burago.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/matchbox.png',
    outputs: [
      { path: 'public/assets/matchbox.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  {
    input: 'public/assets/poprace.png',
    outputs: [
      { path: 'public/assets/poprace.webp', width: 320, quality: 85, preserveAlpha: true },
    ],
  },
  // Navbar logo — max display 40px at 3x = 120px
  {
    input: 'public/logo.png',
    outputs: [
      { path: 'public/logo.webp', width: 120, quality: 85, preserveAlpha: true },
    ],
  },
  // QR code — displayed at 192×192 (w-48), serve at 2x = 384px
  {
    input: 'public/assets/QR.png',
    outputs: [
      { path: 'public/assets/QR.webp', width: 384, quality: 90, preserveAlpha: true },
    ],
  },
];

async function optimize() {
  // Create originals backup folder
  const backupDir = 'public/assets/originals';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  for (const item of OPTIMIZATIONS) {
    // Backup original
    const basename = path.basename(item.input);
    const backupPath = path.join(backupDir, basename);
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(item.input, backupPath);
    }

    for (const output of item.outputs) {
      const pipeline = sharp(item.input).resize(output.width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });

      if (output.preserveAlpha) {
        await pipeline.webp({ quality: output.quality, alphaQuality: 90 }).toFile(output.path);
      } else {
        await pipeline.webp({ quality: output.quality }).toFile(output.path);
      }

      const originalSize = fs.statSync(item.input).size;
      const newSize = fs.statSync(output.path).size;
      const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
      console.log(`✓ ${output.path} — ${(newSize / 1024).toFixed(0)} KB (${savings}% smaller)`);
    }
  }
}

optimize().catch(console.error);
```

**Run:**
```bash
node scripts/optimize-images.mjs
```

### 2.2 Expected Output Sizes

| Image | Original | Estimated WebP | Savings |
|-------|----------|---------------|---------|
| gt3rs.webp (1920w) | 977 KB | ~120-180 KB | ~80% |
| gt3rs-mobile.webp (768w) | 977 KB | ~40-60 KB | ~95% |
| blue-gtr.webp (1280w) | 660 KB | ~80-120 KB | ~83% |
| pagani.webp (1280w) | 1.7 MB | ~100-150 KB | ~92% |
| ford.webp (1280w) | 670 KB | ~80-120 KB | ~83% |
| Brand logos (×6, 320w each) | ~190 KB total | ~30 KB total | ~84% |
| logo.webp (120w) | 250 KB | ~5 KB | ~98% |
| QR.webp (384w) | 169 KB | ~20 KB | ~88% |

**Estimated total savings: ~4.1+ MB**

### 2.3 Delete Unused Duplicates

These files in `app/assets/` are duplicates of files already in `public/assets/` and are NOT imported anywhere except the originals:

| File | Size | Action |
|------|------|--------|
| `app/assets/gt3rs.jpg` | 977 KB | **Delete** — duplicate of `public/assets/gt3rs.jpg` |
| `app/assets/favicon.png` | 1.8 MB | **Delete** — unused, real favicon is `public/favicon.png` (3 KB) |
| `app/assets/logo.png` | 343 KB | **Delete** — unused, real logo is `public/logo.png` |
| `app/assets/QR.png` | 169 KB | **Delete** — duplicate of `public/assets/QR.png` |
| `app/assets/PosterCars.png` | 15 KB | **Delete** — duplicate of `public/assets/PosterCars.png` |
| `app/assets/hotwheels.png` | 80 KB | **Delete** — unused duplicate (brands use `/assets/hotwheels.png` via `lib/brands.ts`) |
| `app/assets/burago.png` | 40 KB | **Delete** — unused duplicate |
| `app/assets/mini-gt.png` | 31 KB | **Delete** — unused duplicate |
| `app/assets/poprace.png` | 17 KB | **Delete** — unused duplicate |
| `app/assets/tarmac_work.png` | 59 KB | **Delete** — unused variant (note: underscore vs hyphen) |
| `app/assets/matchbox-removebg-preview.png` | 99 KB | **Delete** — unused variant |
| `app/assets/f40.jpg` | 788 KB | **Delete** — not imported anywhere |

> **KEEP these `app/assets/` files** — they are statically imported by `ThemeGrid.tsx`:
> - `app/assets/blue-gtr.jpg` (will be replaced by `.webp`)
> - `app/assets/pagani.png` (will be replaced by `.webp`)
> - `app/assets/ford.jpg` (will be replaced by `.webp`)

**Total dead file cleanup: ~3.3 MB removed from repo**

---

## 3. Phase 2 — Update Code References

### 3.1 Hero.tsx — Use WebP + Add `sizes` Prop

**File:** `components/Hero.tsx`

**Current:**
```tsx
<Image
  src="/assets/gt3rs.jpg"
  alt="Porsche 911 GT3 RS"
  fill
  className="object-contain opacity-90 object-right-bottom scale-[0.85] translate-x-[5%] -translate-y-[3%]"
  priority
  referrerPolicy="no-referrer"
/>
```

**Change to:**
```tsx
<Image
  src="/assets/gt3rs.webp"
  alt="Porsche 911 GT3 RS"
  fill
  sizes="100vw"
  className="object-contain opacity-90 object-right-bottom scale-[0.85] translate-x-[5%] -translate-y-[3%]"
  priority
  referrerPolicy="no-referrer"
/>
```

**Changes:**
- `src` → `.webp` extension
- Added `sizes="100vw"` — hero is full-viewport, this tells Next.js to serve the appropriate width

### 3.2 ThemeGrid.tsx — Use WebP Static Imports

**File:** `components/ThemeGrid.tsx`

**Current:**
```tsx
import blueGtr from '@/app/assets/blue-gtr.jpg';
import pagani from '@/app/assets/pagani.png';
import fordGt40 from '@/app/assets/ford.jpg';
```

**Change to:**
```tsx
import blueGtr from '@/app/assets/blue-gtr.webp';
import pagani from '@/app/assets/pagani.webp';
import fordGt40 from '@/app/assets/ford.webp';
```

> `placeholder="blur"` will continue to work — `sharp` / Next.js generates blur data from WebP static imports.

### 3.3 BrandCard.tsx — Use WebP Logos

**File:** `components/BrandCard.tsx` — No changes needed here. The `src` comes from `lib/brands.ts`.

**File:** `lib/brands.ts`

Update all logo paths from `.png` to `.webp`:

```ts
// hotwheels
logo: '/assets/hotwheels.webp',
// bburago
logo: '/assets/burago.webp',
// minigt
logo: '/assets/mini-gt.webp',
// poprace
logo: '/assets/poprace.webp',
// tarmacworks
logo: '/assets/tarmac-works.webp',
// matchbox
logo: '/assets/matchbox.webp',
```

### 3.4 BrandPage.tsx — Add `sizes` Prop

**File:** `components/BrandPage.tsx`

The `<Image>` for brand logo (width=160, height=80) should add a `sizes` hint:

```tsx
<Image
  src={brand.logo}
  alt={`${brand.name} diecast model cars — official brand logo`}
  width={160}
  height={80}
  sizes="160px"
  className="object-contain"
  priority
/>
```

### 3.5 Navbar Logo — Use WebP + Remove `unoptimized`

**File:** `components/Navbar.tsx`

**Current (line 35-43):**
```tsx
<Image
  src="/logo.png"
  alt="Dream Diecast logo"
  width={36}
  height={36}
  className="w-8 h-8 md:w-9 md:h-9 object-contain"
  unoptimized
  priority
/>
```

**Change to:**
```tsx
<Image
  src="/logo.webp"
  alt="Dream Diecast logo"
  width={36}
  height={36}
  sizes="36px"
  className="w-8 h-8 md:w-9 md:h-9 object-contain"
  priority
/>
```

**Changes:**
- `src` → `.webp` extension
- **Remove `unoptimized` prop** — this was bypassing all Next.js image optimization, serving the full 521×521 250KB PNG on every page load. This is the single biggest quick win.
- Added `sizes="36px"` — tells Next.js the display size so it picks the right srcSet breakpoint

### 3.6 QR Code — Use WebP

**Files:** `app/checkout/page.tsx` (line 502), `app/pay/[preOrderId]/page.tsx` (line 450)

Both use `<NextImage src="/assets/QR.png" ... fill />` inside a 192×192 container. Change to:

```tsx
src="/assets/QR.webp"
```

Add `sizes="192px"` to both instances.

### 3.7 BrandCard.tsx — Convert `<img>` to Next.js `<Image>`

**File:** `components/BrandCard.tsx`

The brand logos currently use a plain `<img>` tag (with ESLint disabled), which:
- Bypasses Next.js image optimization entirely
- Serves the full-size PNG to all devices regardless of display size
- Has no lazy loading, no srcSet, no format negotiation

**Current (line 49-54):**
```tsx
/* eslint-disable @next/next/no-img-element */
...
<img
  src={brand.logo}
  alt={`${brand.name} diecast cars — shop ${brand.name} scale models at DreamDiecast`}
  width={isCompact ? 100 : 140}
  height={isCompact ? 60 : 80}
  className={`object-contain opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 ${brand.invertLogo ? 'invert brightness-200' : ''}`}
/>
```

**Change to:**
```tsx
import Image from 'next/image';
...
<Image
  src={brand.logo}
  alt={`${brand.name} diecast cars — shop ${brand.name} scale models at DreamDiecast`}
  width={isCompact ? 100 : 140}
  height={isCompact ? 60 : 80}
  sizes={isCompact ? '100px' : '140px'}
  className={`object-contain opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 ${brand.invertLogo ? 'invert brightness-200' : ''}`}
/>
```

**Changes:**
- Remove `/* eslint-disable @next/next/no-img-element */`
- Replace `<img>` with Next.js `<Image>` — enables automatic WebP serving, lazy loading, and srcSet generation
- Add `sizes` prop for correct breakpoint selection
- Alt text preserved exactly as-is (SEO safe)

### 3.9 Convex Settings Fallback

**File:** `convex/settings.ts`

Update the default hero background path:
```ts
heroBackground: "/assets/gt3rs.webp"   // was .png
```

### 3.10 SEO Metadata — Organization Schema Logo

**File:** `components/JsonLd.tsx` (OrganizationJsonLd)

The `logo` field references `https://dreamdiecast.in/logo.png`.

**Decision: Keep as `.png`** — Schema.org and Google recommend PNG/JPG for logo in structured data. The original PNG is kept in `public/assets/originals/` and the `public/logo.png` file stays (it's only 250 KB and only loaded by crawlers, not users). Alternatively, update to `.webp` if Google's Rich Results Test accepts it.

> If you decide to remove the original `public/logo.png`, then update JsonLd.tsx to point to `.webp`.

### 3.11 Layout Metadata — OG Image

**File:** `app/layout.tsx`

The OG image path (`/og-image.jpg`) is a separate file that doesn't exist yet (Phase 6/7 of SEO overhaul). No changes needed here — OG images should stay as JPG/PNG for maximum social platform compatibility.

---

## 4. Phase 3 — Next.js Image Config

### 4.1 Update `next.config.ts`

Add image optimization config to the existing `images` block:

```ts
images: {
  formats: ['image/webp'],
  deviceSizes: [640, 768, 1024, 1280, 1920],
  imageSizes: [40, 80, 120, 160, 320],
  remotePatterns: [
    // ... existing patterns unchanged ...
  ],
},
```

**What this does:**
- `formats: ['image/webp']` — Next.js serves WebP for all optimized images (already default, but explicit is better)
- `deviceSizes` — breakpoints for `sizes="100vw"` images (hero, theme grid). Generates srcSet at these widths.
- `imageSizes` — breakpoints for fixed-width images (logos, navbar). Covers 40px (navbar), 80px (brand compact), 120px (logo retina), 160px (brand landing), 320px (brand retina).

### 4.2 WebP Static Import Support

Next.js supports WebP static imports out of the box. No additional webpack config needed. The `blur` placeholder is also auto-generated for WebP.

---

## 5. File Structure Summary

### New Files
```
scripts/optimize-images.mjs             <- One-time optimization script (can delete after use)
public/assets/originals/                <- Backup of original full-res images
public/assets/gt3rs.webp                <- Optimized hero (1920w)
public/assets/gt3rs-mobile.webp         <- Optimized hero mobile (768w) — optional, for manual srcSet
public/assets/hotwheels.webp            <- Optimized brand logo (320w)
public/assets/mini-gt.webp              <- Optimized brand logo (320w)
public/assets/tarmac-works.webp         <- Optimized brand logo (320w)
public/assets/burago.webp               <- Optimized brand logo (320w)
public/assets/matchbox.webp             <- Optimized brand logo (320w)
public/assets/poprace.webp              <- Optimized brand logo (320w)
public/logo.webp                        <- Optimized navbar logo (120w)
public/assets/QR.webp                   <- Optimized QR code (384w)
app/assets/blue-gtr.webp               <- Optimized theme image (1280w)
app/assets/pagani.webp                  <- Optimized theme image (1280w)
app/assets/ford.webp                    <- Optimized theme image (1280w)
```

### Modified Files
```
components/Hero.tsx                     <- src → .webp, add sizes prop
components/ThemeGrid.tsx                <- imports → .webp
components/BrandPage.tsx                <- add sizes prop
components/BrandCard.tsx                <- convert <img> to <Image>, add sizes prop
components/Navbar.tsx                   <- logo src → .webp, remove unoptimized, add sizes
lib/brands.ts                           <- logo paths → .webp
convex/settings.ts                      <- default hero path → .webp
next.config.ts                          <- add deviceSizes, imageSizes, formats
app/checkout/page.tsx                   <- QR src → .webp, add sizes prop
app/pay/[preOrderId]/page.tsx           <- QR src → .webp, add sizes prop
```

### Deleted Files
```
app/assets/gt3rs.jpg                    <- Unused duplicate (977 KB)
app/assets/favicon.png                  <- Unused duplicate (1.8 MB)
app/assets/logo.png                     <- Unused duplicate (343 KB)
app/assets/QR.png                       <- Unused duplicate (169 KB)
app/assets/PosterCars.png              <- Unused duplicate (15 KB)
app/assets/hotwheels.png               <- Unused duplicate (80 KB)
app/assets/burago.png                   <- Unused duplicate (40 KB)
app/assets/mini-gt.png                  <- Unused duplicate (31 KB)
app/assets/poprace.png                  <- Unused duplicate (17 KB)
app/assets/tarmac_work.png             <- Unused variant (59 KB)
app/assets/matchbox-removebg-preview.png <- Unused variant (99 KB)
app/assets/f40.jpg                      <- Not imported anywhere (788 KB)
```

### Kept Unchanged (SEO-critical — do NOT touch)
```
components/JsonLd.tsx                   <- Organization schema logo stays .png
app/layout.tsx                          <- OG image metadata stays .jpg
components/ProductCard.tsx              <- Product image alt text unchanged
app/products/[slug]/page.tsx            <- Product JSON-LD unchanged
public/logo.png                         <- Kept for schema.org logo reference
public/assets/gt3rs.jpg                 <- Kept in originals/ backup
All alt text across the codebase        <- Zero alt text changes
```

---

## 6. Edge Cases & Error Handling

| Case | Handling |
|------|----------|
| Browser doesn't support WebP | Next.js `<Image>` serves fallback format automatically for remote/optimized images. For static imports served directly, WebP support is 97%+ (all modern browsers). Negligible risk. |
| `placeholder="blur"` with WebP | Works — Next.js generates blur placeholder from WebP static imports via `sharp` at build time |
| Convex settings return old `.png` path | The `.png` file is backed up in `originals/`. If settings DB has old value, it will 404. Update the Convex setting value in the admin panel or via migration. |
| Git LFS considerations | Not applicable — images are under 2 MB each, within Git's reasonable limits |
| OG image social preview | OG images stay as JPG/PNG — social platforms have inconsistent WebP support. No change needed. |
| Google crawlers reading logo in schema | `public/logo.png` is kept — schema.org logo URL remains valid |
| Theme grid blur placeholders | WebP static imports generate blur data identically to JPG/PNG. No visual change. |
| Old `.png`/`.jpg` originals still in `public/assets/` | After creating `.webp` versions and updating all code references, the original files (except `logo.png` for schema) can optionally be deleted from `public/assets/` to save repo size. Keep them in `public/assets/originals/` backup. Do NOT delete until all references are verified. |
| BrandCard hover/scale animations after `<img>` → `<Image>` | Next.js `<Image>` renders as `<img>` inside a wrapper `<span>`. The CSS `group-hover:scale-110` class targets the `<img>` element directly via className, so animations will continue to work. Verify visually. |
| BrandCard `invertLogo` filter with `<Image>` | The `invert brightness-200` CSS filter works identically on Next.js `<Image>` output since it applies to the rendered `<img>` element. No change needed. |

---

## 7. Completion Criteria

### Asset Generation
- [ ] All `.webp` versions created at correct dimensions
- [ ] Original files backed up to `public/assets/originals/`
- [ ] All 12 unused duplicate files in `app/assets/` deleted

### Code Changes
- [ ] `Hero.tsx` uses `.webp` with `sizes` prop
- [ ] `ThemeGrid.tsx` imports `.webp` files with `placeholder="blur"` still working
- [ ] `lib/brands.ts` logo paths updated to `.webp`
- [ ] `BrandCard.tsx` converted from `<img>` to `<Image>` with `sizes` prop
- [ ] `BrandPage.tsx` has `sizes` prop on logo `<Image>`
- [ ] `Navbar.tsx` uses `.webp` logo, `unoptimized` prop removed, `sizes` prop added
- [ ] `app/checkout/page.tsx` and `app/pay/[preOrderId]/page.tsx` QR image → `.webp` with `sizes`
- [ ] `next.config.ts` has `deviceSizes`, `imageSizes`, `formats` configured
- [ ] `convex/settings.ts` default hero path updated

### SEO Safety Verification
- [ ] No alt text was changed anywhere
- [ ] No JSON-LD schema markup was changed (Organization logo stays `.png`)
- [ ] No OG/Twitter metadata image paths were changed
- [ ] `public/logo.png` still exists for schema.org logo reference
- [ ] All `priority` props on LCP images preserved

### Build & Performance
- [ ] `next build` passes cleanly
- [ ] Lighthouse Performance score improves (target: LCP < 2.5s)
- [ ] All existing pages render correctly — visual regression check on:
  - Home page (hero image, brand grid, theme grid)
  - Brand pages (brand logo header + brand cards)
  - Checkout/Pay pages (QR code renders correctly)
  - All pages (navbar logo)

---

## 8. Performance Impact Estimate

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| Hero image payload | 977 KB | ~150 KB | 85% reduction |
| Theme grid total | 3.0 MB | ~350 KB | 88% reduction |
| Brand logos total | 190 KB | ~30 KB | 84% reduction (+ now lazy loaded via `<Image>`) |
| Navbar logo | 250 KB (unoptimized!) | ~5 KB | 98% reduction — was serving raw 521×521 PNG |
| QR code | 169 KB | ~20 KB | 88% reduction |
| Dead file cleanup | 3.3 MB | 0 | Removed from repo |
| **Total page weight saved** | | **~4 MB** | First meaningful paint |
| LCP (hero) | ~3-4s mobile | ~1-2s mobile | WebP + right-sized |
| SEO Performance score | 68 | 72-75 | Helps reach Phase 6 target |
