# Bug Fixes — Batch 1

Seven issues covering auth-gated pages, search, themes, product categorization, footer links, and "New Arrivals" lifecycle.

---

## Issue 1: Garage & Pre-Orders pages don't load when not logged in

**Current behaviour:** `/garage` and `/garage/pre-orders` call `useGarage()` → `useQuery(api.garage.byUser, "skip")` when no user. The query stays in `undefined` state forever, so `loading` is always `true` and the page shows an infinite spinner instead of the "Access Denied" screen.

**Root cause:** `useGarage` returns `{ loading: true }` when there is no user because `data === undefined` is true both when the query is skipped and when it's in-flight. The garage page checks `authLoading || itemsLoading || ordersLoading` *before* checking `!user`, so it never reaches the "Access Denied" UI.

**Fix:**

### `hooks/useGarage.ts`
Return `loading: false` when there is no user (query is skipped, not pending):

```ts
return {
  items,
  loading: user ? data === undefined : false,
};
```

### `hooks/useOrders.ts`
Apply the same pattern — if the hook also passes `"skip"` when no user, ensure `loading` returns `false` when skipped.

### `app/garage/page.tsx` (lines 36-57)
Reorder the guard checks so `!user` is evaluated **before** the loading check for garage/orders:

```tsx
if (authLoading) {
  return <Spinner />;
}

if (!user) {
  return <AccessDenied />;
}

if (itemsLoading || ordersLoading) {
  return <Spinner />;
}
```

### `app/garage/pre-orders/page.tsx`
Apply the same guard-reordering if the same pattern exists.

### Files to modify
- `hooks/useGarage.ts`
- `hooks/useOrders.ts`
- `app/garage/page.tsx`
- `app/garage/pre-orders/page.tsx`

---

## Issue 2: Search button in the header bar doesn't work

**Current behaviour:** The `<Search>` icon in `Navbar.tsx` (line 45-47) is a plain `<button>` with no `onClick` handler. It does nothing.

**Fix:** Implement a search overlay/modal that filters products by name and brand.

### New file: `components/SearchModal.tsx`
A modal/overlay triggered by the search button containing:
- A text input with autofocus
- Client-side filtering against all products (via `useProducts()`) matching `product.name` and `product.brand` against the query (case-insensitive substring match)
- Display matching products as a list of clickable results that open `ProductDetailModal`
- Close on `Escape` key, backdrop click, or X button
- Debounce input by ~200ms to avoid excessive re-renders

### `components/Navbar.tsx`
- Import `SearchModal`
- Add state: `const [isSearchOpen, setIsSearchOpen] = useState(false);`
- Attach `onClick={() => setIsSearchOpen(true)}` to the search `<button>` (line 45)
- Render `<SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />` alongside `CartDrawer` and `AuthModal`

### Files to modify
- `components/Navbar.tsx`

### Files to create
- `components/SearchModal.tsx`

---

## Issue 3: "Shop by Theme" cards don't work

**Current behaviour:** `ThemeGrid.tsx` links to `/themes/${theme.slug}` but no `/themes/[slug]` route exists. Clicking a theme card leads to a 404.

**Root cause:** The theme names in `ThemeGrid.tsx` (`JDM Legends`, `Exotics & Hypercars`, `Motorsport / Track Day`) are meant to map to the product `category` field. The `CATEGORIES` constant in `lib/constants.ts` has: `"JDM Legends"`, `"Exotics & Hypercars"`, `"Motorsport"`, `"Normal"`.

**Fix:** Create a dynamic theme route that filters products by category.

### New file: `app/themes/[slug]/page.tsx`
- Map slug back to category name:
  ```ts
  const THEME_MAP: Record<string, { category: string; title: string; subtitle: string }> = {
    'jdm-legends': { category: 'JDM Legends', title: 'JDM Legends', subtitle: 'Skylines · Supras · NSXs' },
    'exotics-hypercars': { category: 'Exotics & Hypercars', title: 'Exotics & Hypercars', subtitle: 'Lamborghini · Ferrari · Bugatti' },
    'motorsport-track-day': { category: 'Motorsport', title: 'Motorsport / Track Day', subtitle: 'Le Mans · F1 · DTM' },
  };
  ```
- Use `useProducts()` and filter by `product.category === theme.category`
- Render using the existing `ProductPage` component (same pattern as `/new-arrivals` and `/pre-orders`)
- If slug is not found in `THEME_MAP`, show a 404 or redirect to home

### Files to create
- `app/themes/[slug]/page.tsx`

---

## Issue 4: Products added as "in stock" only appear in "All", not in "In Stock" filter

**Current behaviour:** When admin creates an in-stock product, the `ProductForm` sets:
```ts
status: 'In Stock'
category: form.category  // e.g. "JDM Legends", "Exotics & Hypercars", etc.
```

The `category` field is set to the **theme category** (JDM Legends, Exotics & Hypercars, Motorsport, Normal) — NOT to `"In Stock"`.

But `ProductGrid.tsx` filters "In Stock" tab with:
```ts
if (product.category !== 'In Stock' && product.category !== 'Current Stock') return false;
```

So a product with `category: "JDM Legends"` and `listingType: "in-stock"` will never match the "In Stock" filter.

**Root cause:** The `category` field is being overloaded — it stores the *theme* (JDM Legends, Motorsport, etc.) but the ProductGrid filtering treats it as a *stock status* (In Stock, Pre-Order, New Arrival). These are two different dimensions.

**Fix:** Update `ProductGrid.tsx` filtering to use `listingType` and `status` fields instead of relying solely on `category`:

### `components/ProductGrid.tsx` (lines 28-34)
Change the filter logic:

```ts
.filter(product => {
  if (activeFilter === 'All') return true;

  if (activeFilter === 'In Stock') {
    return product.listingType === 'in-stock'
      || product.category === 'In Stock'
      || product.category === 'Current Stock'
      || product.status === 'In Stock';
  }

  if (activeFilter === 'Pre-Order') {
    return product.listingType === 'pre-order'
      || product.category === 'Pre-Order'
      || product.isPreorder === true;
  }

  if (activeFilter === 'New Arrival') {
    // See Issue 7 below for full implementation
    return product.isNewArrival === true;
  }

  return product.category === activeFilter;
})
```

### `/app/pre-orders/page.tsx` (line 9)
Also update the pre-orders page filter to use `listingType`:
```ts
const preOrderProducts = products.filter(
  p => p.listingType === 'pre-order' || p.category === 'Pre-Order' || p.isPreorder === true
);
```

### Files to modify
- `components/ProductGrid.tsx`
- `app/pre-orders/page.tsx`

---

## Issue 5: Footer quick links are dead (`href="#"`)

**Current behaviour:** In `Footer.tsx`, the quick links "About Us", "Shipping Policy", "Returns & Refunds", and "Privacy Policy" all link to `href="#"` (lines 32-35).

**Fix:** Create simple static pages for each and update the links.

### New files to create
- `app/about/page.tsx` — Static "About Us" page with company description, mission, team info
- `app/shipping-policy/page.tsx` — Shipping policy details (domestic/international rates, timelines, free shipping thresholds)
- `app/returns/page.tsx` — Returns & refunds policy (eligibility, process, timeline)
- `app/privacy/page.tsx` — Privacy policy (data collection, usage, cookies)

Each page should:
- Be a server component (no `'use client'`)
- Use the same dark theme styling (`bg-[#050505]`, white text)
- Have proper heading, padding (`pt-32 pb-20 px-6`), and `max-w-4xl mx-auto` layout
- Contain placeholder copy that the owner can later customize

### `components/Footer.tsx` (lines 32-35)
Update the `<a href="#">` tags to `<Link>` tags:
```tsx
<li><Link href="/about" ...>About Us</Link></li>
<li><Link href="/shipping-policy" ...>Shipping Policy</Link></li>
<li><Link href="/returns" ...>Returns & Refunds</Link></li>
<li><Link href="/privacy" ...>Privacy Policy</Link></li>
```

### Files to modify
- `components/Footer.tsx`

### Files to create
- `app/about/page.tsx`
- `app/shipping-policy/page.tsx`
- `app/returns/page.tsx`
- `app/privacy/page.tsx`

---

## Issue 6: New products added by admin appear in "All" but not "In Stock"

**This is the same root cause as Issue 4.** The admin `ProductForm` sets `category` to the theme name (e.g. `"JDM Legends"`) and `status` to `"In Stock"`, but the ProductGrid filters on `category === 'In Stock'`.

**Fix:** Already covered by Issue 4's changes to `ProductGrid.tsx`. No additional work needed.

---

## Issue 7: New Arrivals logic — products should auto-appear and auto-expire after 2 weeks

**Current behaviour:** The `/new-arrivals` page filters `p.category === 'New Arrival'`. But products are never assigned `category: "New Arrival"` — the admin form sets category to a theme name. So "New Arrivals" is always empty for newly added products.

**Required behaviour:**
- Every newly added product (both in-stock and pre-order) should appear in "New Arrivals" automatically
- Products should stop appearing in "New Arrivals" after **14 days** from creation
- Products should always remain in "All" and their respective stock/pre-order filter

**Fix:** Use the product's `_creationTime` (auto-set by Convex on insert) to determine "new arrival" status. No schema changes needed.

### `components/ProductGrid.tsx`
Add the "New Arrival" filter case (as shown in Issue 4):

```ts
if (activeFilter === 'New Arrival') {
  const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
  const createdAt = getTimestamp(product.createdAt);
  return createdAt > twoWeeksAgo;
}
```

### `app/new-arrivals/page.tsx`
Replace the current `category === 'New Arrival'` filter with the time-based logic:

```ts
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const newProducts = products.filter(p => {
  const createdAt = p.createdAt
    ? (typeof p.createdAt === 'number' ? p.createdAt : new Date(p.createdAt).getTime())
    : 0;
  return createdAt > Date.now() - TWO_WEEKS_MS;
});
```

### `hooks/useProducts.ts`
Ensure the `createdAt` / `_creationTime` field is being passed through from the Convex product data to the `Product` interface. The Convex `_creationTime` field is automatically available — map it to `createdAt` if not already done.

### Files to modify
- `components/ProductGrid.tsx`
- `app/new-arrivals/page.tsx`
- `hooks/useProducts.ts` (verify `createdAt` mapping)

---

## Summary of all files

### Files to modify
| File | Issues |
|------|--------|
| `hooks/useGarage.ts` | #1 |
| `hooks/useOrders.ts` | #1 |
| `hooks/useProducts.ts` | #7 |
| `app/garage/page.tsx` | #1 |
| `app/garage/pre-orders/page.tsx` | #1 |
| `components/Navbar.tsx` | #2 |
| `components/ProductGrid.tsx` | #4, #6, #7 |
| `components/Footer.tsx` | #5 |
| `app/new-arrivals/page.tsx` | #7 |
| `app/pre-orders/page.tsx` | #4 |

### Files to create
| File | Issue |
|------|-------|
| `components/SearchModal.tsx` | #2 |
| `app/themes/[slug]/page.tsx` | #3 |
| `app/about/page.tsx` | #5 |
| `app/shipping-policy/page.tsx` | #5 |
| `app/returns/page.tsx` | #5 |
| `app/privacy/page.tsx` | #5 |

---

## Edge cases & considerations

1. **Issue 1:** The `/garage/pre-orders/page.tsx` file needs to be checked for the same auth-guard ordering bug. Apply the same fix pattern.
2. **Issue 2:** Search should work on mobile too. The search modal should be full-screen on mobile viewports.
3. **Issue 3:** If a slug doesn't match any theme, show a "Theme not found" message rather than crashing.
4. **Issue 4:** Legacy products that already have `category: "In Stock"` or `category: "Current Stock"` should continue to work. The new filter logic must be backwards-compatible with both old and new products.
5. **Issue 7:** `_creationTime` is a Convex system field (milliseconds since epoch). Verify this is included in the `products.list` query response and mapped through `useProducts()`. If not, the `convex/products.ts` `list` query may need to explicitly include it: `{ ...p, id: p._id, createdAt: p._creationTime }`.
6. **Issue 7:** The 14-day window is calculated client-side. This means products may appear/disappear at slightly different times depending on the user's clock. This is acceptable for this use case.

## Completion criteria

- [ ] Unauthenticated users see "Access Denied" on `/garage` and `/garage/pre-orders` instead of infinite spinner
- [ ] Search icon in navbar opens a modal that filters products by name/brand
- [ ] Theme cards navigate to `/themes/{slug}` and show products of that category
- [ ] Products added as "in-stock" via admin appear under the "In Stock" filter tab
- [ ] Footer quick links navigate to real pages with placeholder content
- [ ] All newly added products appear in "New Arrivals" for 14 days, then auto-expire from that view
- [ ] All products always appear under "All" regardless of type
