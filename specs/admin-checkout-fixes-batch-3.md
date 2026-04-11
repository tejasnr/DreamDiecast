# Admin & Checkout Fixes — Batch 3

## Overview

Five targeted fixes across the admin panel and checkout flow:

1. **Arrived+WA button persists after unlisting** a pre-order product
2. **Multi-image carousel on ProductCard** (storefront grid cards)
3. **Asset Manager modal mobile-friendly** (delete button visible on small screens)
4. **Bulk select + delete in Asset Manager** (multi-select mode with bulk delete)
5. **Remove Shiprocket from checkout** (replace with flat-rate or free shipping)

---

## Bug 1 — Arrived+WA button disappears after Unlist

### Current behaviour

In `app/admin/page.tsx` lines 362-427, the Arrived+WA and Unlist buttons are wrapped in an `else` branch of a ternary:

```tsx
{product.status === 'unlisted' ? (
  <Re-list button />
) : (
  <>
    <Arrived + WA button />
    <Unlist button />
  </>
)}
```

When a product is unlisted, only the "Re-list" button shows. The "Arrived + WA" button is hidden.

### Expected behaviour

- **Arrived + WA** button should **always** be visible for pre-order products, regardless of `status`.
- The **Unlist / Re-list** button should toggle as it does today.

### Fix

**File:** `app/admin/page.tsx` (~lines 362-427)

Restructure the button group so that:
1. The **Arrived + WA** button renders unconditionally (outside the ternary).
2. The **Unlist / Re-list** toggle remains inside its own ternary.

```tsx
<div className="flex items-center gap-3">
  {/* Always visible for PO products */}
  <button onClick={arrivedHandler} className="...">
    <CheckCircle /> <MessageCircle /> Arrived + WA
  </button>

  {/* Toggle unlist / re-list */}
  {product.status === 'unlisted' ? (
    <button onClick={relistHandler} className="...">
      <Eye /> Re-list
    </button>
  ) : (
    <button onClick={unlistHandler} className="..." title="Stop PO / Unlist">
      <EyeOff />
    </button>
  )}

  {/* Edit always visible */}
  <button onClick={() => startEdit(product)} className="...">
    <Edit2 />
  </button>
</div>
```

### Edge cases
- If the product has already been marked as arrived (category changed to "Current Stock"), the Arrived+WA button should ideally be hidden or disabled. Check `product.category === 'Current Stock'` to guard.

---

## Bug 2 — Product cards show only 1 image (no carousel)

### Current behaviour

`components/ProductCard.tsx` (line 28-40) renders a single `product.image` with no carousel. Even when a product has multiple images in `product.images[]`, the card only shows the first/default image.

The **ProductDetailModal** already has a working image carousel with arrows and thumbnails (`components/ProductDetailModal.tsx` lines 93-141).

### Expected behaviour

Product cards on the storefront grid should show image navigation (left/right arrows) when `product.images.length > 1`, similar to the detail modal but simpler (no thumbnails needed on the card).

### Fix

**File:** `components/ProductCard.tsx`

1. Add `useState` for `activeImageIndex`.
2. Build `galleryImages` array the same way the modal does:
   ```tsx
   const galleryImages = product.images?.length ? product.images : product.image ? [product.image] : [];
   const hasMultiple = galleryImages.length > 1;
   const currentImage = galleryImages[activeImageIndex] || product.image;
   ```
3. Replace the single `<Image src={product.image} .../>` with `<Image src={currentImage} .../>`.
4. Add left/right `ChevronLeft` / `ChevronRight` arrow buttons (shown on hover) inside the image container, positioned with `absolute left-2 top-1/2` and `absolute right-2 top-1/2`.
5. Arrows call `setActiveImageIndex` with modular wrap-around logic.
6. Add dot indicators at the bottom of the image for visual feedback (e.g., small circles, active one = accent color).
7. Arrows must call `e.stopPropagation()` to prevent triggering the card's `onClick` (which opens the detail modal).

### Edge cases
- Single image products: no arrows, no dots — behaves exactly as today.
- Zero images: show "No Image" placeholder as today.
- Reset `activeImageIndex` to 0 if `product.id` changes (unlikely on a static card, but safe).

---

## Bug 3 — Asset Manager modal not mobile-friendly

### Current behaviour

`components/AssetManager.tsx` — the asset grid item overlay (lines 327-341) shows the delete button (`<Trash2>`) only on `group-hover`, which doesn't trigger reliably on touch devices. The overlay uses `opacity-0 group-hover:opacity-100` so the delete button is invisible on mobile.

The modal container itself (`max-w-6xl h-[85vh]`) also doesn't adapt well to small screens — padding is tight and buttons can be cut off.

### Expected behaviour

- Delete button should be **always visible** on mobile (not hover-dependent).
- Modal should have better mobile layout: smaller padding, full-width on small screens.
- Asset grid should be 2 columns on mobile (already is via `grid-cols-2`), which is fine.

### Fix

**File:** `components/AssetManager.tsx`

1. **Delete button visibility on mobile:** Change the overlay from `opacity-0 group-hover:opacity-100` to `opacity-100 md:opacity-0 md:group-hover:opacity-100`. This makes the overlay always visible on mobile but hover-toggled on desktop.

2. **Modal container responsive sizing:** Update the modal div (line 162):
   ```
   Before: className="relative w-full max-w-6xl h-[85vh] glass flex flex-col ..."
   After:  className="relative w-full max-w-6xl h-[95vh] md:h-[85vh] glass flex flex-col ..."
   ```

3. **Header padding:** Update header div (line 165):
   ```
   Before: className="p-6 border-b ..."
   After:  className="p-4 md:p-6 border-b ..."
   ```

4. **Upload zone padding:** Update drop zone container (line 181):
   ```
   Before: className="mx-6 mt-6 border-2 ..."
   After:  className="mx-3 md:mx-6 mt-4 md:mt-6 border-2 ..."
   ```

5. **Grid padding:** Update grid container (line 284):
   ```
   Before: className="flex-1 overflow-y-auto p-6 custom-scrollbar"
   After:  className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar"
   ```

6. **Asset item overlay:** Add a persistent delete button at the top-right corner of each asset card on mobile, outside the hover overlay:
   ```tsx
   {/* Mobile-visible delete */}
   <button
     onClick={(e) => { e.stopPropagation(); handleDelete(asset._id); }}
     className="absolute top-1 right-1 z-10 p-1.5 bg-black/70 text-red-400 rounded md:hidden"
   >
     <Trash2 size={14} />
   </button>
   ```

### Edge cases
- Touch devices that do support hover (iPad with trackpad): the `md:` breakpoint handles this since iPads typically render at `md` width or above.

---

## Bug 4 — Bulk select and delete in Asset Manager

### Current behaviour

The Asset Manager already has multi-select logic (`selectedAssets` Set, `toggleAssetSelection`, selection UI with checkmarks). However:
- Selection only works when `onSelect` is provided (i.e., when opened from ProductForm as an asset picker).
- When opened standalone from the admin page (no `onSelect` prop), clicking an asset copies its URL — there's no selection or bulk delete.
- The action bar only shows "Add to Product" — no "Delete Selected" option.

### Expected behaviour

- Asset selection should **always** work, not only when `onSelect` is provided.
- When assets are selected, show a **"Delete Selected"** button in the action bar.
- The "Add to Product" button remains when `onSelect` is provided.
- A **"Select All" / "Deselect All"** toggle in the header or action bar.

### Fix

**File:** `components/AssetManager.tsx`

1. **Always enable selection:** Change the asset `onClick` handler (lines 306-312):
   ```tsx
   onClick={() => toggleAssetSelection(asset.url)}
   ```
   Remove the `onSelect` conditional — always toggle selection on click. If user wants to copy URL, they can long-press or use a separate copy button.

2. **Add bulk delete handler:**
   ```tsx
   const handleBulkDelete = async () => {
     if (!confirm(`Delete ${selectedAssets.size} asset(s)? This cannot be undone.`)) return;
     const assetsToDelete = assets?.filter(a => selectedAssets.has(a.url)) || [];
     for (const asset of assetsToDelete) {
       await removeAsset({ workosUserId: user?.workosUserId, id: asset._id as Id<"assets"> });
     }
     setSelectedAssets(new Set());
   };
   ```

3. **Update action bar** (lines 258-278) to include Delete Selected:
   ```tsx
   <div className="flex items-center gap-3">
     <button onClick={handleBulkDelete} className="bg-red-500/20 text-red-400 px-4 py-2 text-[10px] ...">
       <Trash2 size={14} /> Delete Selected
     </button>
     {onSelect && (
       <button onClick={handleAddSelectedToProduct} className="bg-accent ...">
         <CheckCircle size={14} /> Add to Product
       </button>
     )}
     <button onClick={() => setSelectedAssets(new Set())} className="...">
       Clear
     </button>
   </div>
   ```

4. **Add Select All / Deselect All** button in the header area:
   ```tsx
   <button onClick={() => {
     if (selectedAssets.size === (assets?.length || 0)) {
       setSelectedAssets(new Set());
     } else {
       setSelectedAssets(new Set(assets?.map(a => a.url) || []));
     }
   }}>
     {selectedAssets.size === assets?.length ? 'Deselect All' : 'Select All'}
   </button>
   ```

### Edge cases
- Deleting assets that are currently used by products won't break anything (images are stored by URL, and the URL will just 404). But worth noting.
- Bulk delete should handle errors gracefully — if one delete fails, continue with others and report at the end.

---

## Bug 5 — Remove Shiprocket from checkout

### Current behaviour

- `app/api/shipping/calculate/route.ts` — full Shiprocket API integration (auth, serviceability check, rate calculation).
- `app/checkout/details/page.tsx` — calls `/api/shipping/calculate` on pincode entry, displays courier name and ETD.
- Uses env vars: `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_POSTCODE`.

### Expected behaviour

Remove the Shiprocket integration entirely. Replace with a simple flat-rate shipping model:
- **Pre-orders:** Shipping is FREE (already handled).
- **In-stock items:** Use a flat shipping rate defined in `lib/constants.ts` (e.g., `FLAT_SHIPPING_RATE = 80`).

### Fix

**Files to modify:**

1. **`lib/constants.ts`** — Add:
   ```ts
   export const FLAT_SHIPPING_RATE = 80;
   ```

2. **`app/checkout/details/page.tsx`** — Remove the `calculateShipping` fetch call to `/api/shipping/calculate`. Replace with:
   ```tsx
   const calculateShipping = async (pincode: string) => {
     if (isShippingFree) {
       setShippingInfo({ cost: 0, courier: 'Free Shipping', etd: '' });
       setShippingCharges(0);
       return;
     }
     setShippingInfo({
       cost: FLAT_SHIPPING_RATE,
       courier: 'Standard Shipping',
       etd: '5-7',
     });
     setShippingCharges(FLAT_SHIPPING_RATE);
   };
   ```
   - Remove `isCalculating` state and its loader spinner (or keep it but it'll never show).
   - Import `FLAT_SHIPPING_RATE` from `@/lib/constants`.

3. **`app/api/shipping/calculate/route.ts`** — **Delete this file entirely.** It's no longer needed.

4. **Remove env vars** from Vercel/`.env`: `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_POSTCODE`.

### Edge cases
- Any other files referencing `/api/shipping/calculate` or Shiprocket — search codebase and clean up.
- The `CartContext` still manages `shippingCharges` state — this stays as-is, just set to the flat rate.

---

## Bug 6 — Unlist / Re-list button for in-stock products

### Current behaviour

In `app/admin/page.tsx` lines 214-285, the **Products** tab lists in-stock products with only **Edit** and **Delete** buttons (lines 268-281). There is no way to unlist/re-list an in-stock product — that toggle only exists in the Pre-Orders tab.

### Expected behaviour

In-stock products should also have an **Unlist** button (eye-off icon) that sets `status: 'unlisted'`, and when unlisted, a **Re-list** button (eye icon) to set `status: 'active'`. This mirrors the pre-order tab's unlist/re-list behaviour.

### Fix

**File:** `app/admin/page.tsx` (~lines 268-281)

Add unlist/re-list toggle button to the in-stock product action buttons:

```tsx
<div className="flex items-center gap-3">
  {/* Unlist / Re-list toggle */}
  {product.status === 'unlisted' ? (
    <button
      onClick={() => handleStatusChange(product, 'active', `Re-list "${product.name}"?`)}
      className="p-3 bg-accent/20 hover:bg-accent hover:text-white transition-all rounded-full"
      title="Re-list product"
    >
      <Eye size={18} />
    </button>
  ) : (
    <button
      onClick={() => handleStatusChange(product, 'unlisted', `Unlist "${product.name}" from the store?`)}
      className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all rounded-full"
      title="Unlist product"
    >
      <EyeOff size={18} />
    </button>
  )}

  <button onClick={() => startEdit(product)} className="..."><Edit2 /></button>
  <button onClick={() => handleDelete(product.id)} className="..."><Trash2 /></button>
</div>
```

Also add visual indicator for unlisted products (dim the row like pre-orders do):
```tsx
className={`glass p-6 flex ... ${product.status === 'unlisted' ? 'opacity-50' : ''}`}
```

And add the "Unlisted" badge in the product metadata row, same as pre-orders have:
```tsx
{product.status === 'unlisted' && (
  <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-sm">
    <EyeOff size={10} /> Unlisted
  </span>
)}
```

### Edge cases
- Unlisted in-stock products should be filtered out from the public storefront (ensure the products query/filter in the frontend pages already checks `status !== 'unlisted'`).
- The product list in admin should still show unlisted products (which it does, since it uses `api.products.list` without filtering).

---

## Bug 7 — Replace `confirm()` dialogs with custom confirmation modal

### Current behaviour

Throughout `app/admin/page.tsx`, destructive actions use the browser's native `confirm()` / `window.confirm()`:
- Line 276: `handleDelete` (no confirm, just deletes directly!)
- Line 383: Arrived+WA — `confirm("Mark ... as arrived?")`
- Line 410: Unlist — `confirm("Unlist ... from the public pre-orders page?")`
- Line 117 in `components/AssetManager.tsx`: `confirm('Are you sure you want to delete this asset?')`

These are ugly browser-native popups, especially on mobile.

### Expected behaviour

Replace all `confirm()` calls with a reusable **ConfirmModal** component — a styled modal matching the app's dark theme with:
- Title text
- Description/warning message
- "Cancel" and "Confirm" buttons (confirm button red for destructive actions, accent for non-destructive)
- The modal should be async-awaitable or callback-based

### Fix

**New file:** `components/admin/ConfirmModal.tsx`

```tsx
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;      // default: "Confirm"
  cancelLabel?: string;       // default: "Cancel"
  variant?: 'danger' | 'default';  // danger = red confirm button
  onConfirm: () => void;
  onCancel: () => void;
}
```

The modal should:
- Use the same glass/dark style as other modals in the app
- Animate in/out with `motion` like ProductForm does
- Have a backdrop that closes on click (triggers cancel)
- Focus trap is nice-to-have but not required

**File:** `app/admin/page.tsx`

1. Add state to manage the confirm modal:
   ```tsx
   const [confirmModal, setConfirmModal] = useState<{
     title: string;
     message: string;
     variant: 'danger' | 'default';
     onConfirm: () => void;
   } | null>(null);
   ```

2. Create a helper to show confirmations:
   ```tsx
   const showConfirm = (title: string, message: string, variant: 'danger' | 'default', onConfirm: () => void) => {
     setConfirmModal({ title, message, variant, onConfirm });
   };
   ```

3. Replace all `confirm()` calls:
   - **Delete product:** `showConfirm('Delete Product', 'This will permanently remove ...', 'danger', () => removeProduct(...))`
   - **Arrived+WA:** `showConfirm('Mark as Arrived', 'This will convert to in-stock and notify ...', 'default', () => { markArrived(); ... })`
   - **Unlist:** `showConfirm('Unlist Product', 'This will hide the product from ...', 'danger', () => updateProduct({ status: 'unlisted' }))`
   - **Re-list:** `showConfirm('Re-list Product', 'This will make the product visible ...', 'default', () => updateProduct({ status: 'active' }))`

4. Render `<ConfirmModal>` at the bottom of the page component.

**File:** `components/AssetManager.tsx`

Same pattern for asset deletion confirms — either import ConfirmModal or use the same state-based approach.

### Edge cases
- Multiple confirm dialogs shouldn't stack — only one at a time (ensured by single state variable).
- If the async action fails after confirming, show an error (can use existing `console.error` pattern for now, or a toast in the future).

---

## Bug 8 — Low stock should say "Only Few Left" instead of exact count

### Current behaviour

**`components/ProductCard.tsx`** (lines 55-59):
```tsx
{isLowStock && (
  <span className="bg-orange-600 text-white ...">
    Only {product.stock} Left
  </span>
)}
```

**`components/ProductDetailModal.tsx`** (lines 179-185):
```tsx
{product.stock > 0 ? `${product.stock} Units In Stock` : 'Out of Stock'}
```

Both places expose the exact stock number to customers.

### Expected behaviour

- **ProductCard badge:** Show `"Only Few Left"` instead of `"Only {n} Left"` when stock <= 5.
- **ProductDetailModal stock indicator:** Show `"Only Few Left"` when stock <= 5, show `"In Stock"` when stock > 5 (no exact number). Show `"Out of Stock"` when stock === 0.

### Fix

**File:** `components/ProductCard.tsx` (line 57)

```tsx
// Before:
Only {product.stock} Left

// After:
Only Few Left
```

**File:** `components/ProductDetailModal.tsx` (line 183)

```tsx
// Before:
{product.stock > 0 ? `${product.stock} Units In Stock` : 'Out of Stock'}

// After:
{product.stock <= 0
  ? 'Out of Stock'
  : product.stock <= 5
    ? 'Only Few Left'
    : 'In Stock'}
```

### Edge cases
- Admin panel can still show exact stock numbers (that's internal info) — this change only affects customer-facing components.

---

## Bug 9 — Product image is zoomed/cropped when opened in modal

### Current behaviour

In `components/ProductDetailModal.tsx` (lines 81-90), the main image uses:
```tsx
<div className="relative aspect-[4/3] md:aspect-auto md:flex-1">
  <Image
    src={currentImage}
    alt={product.name}
    fill
    className="object-cover"
  />
</div>
```

`object-cover` crops the image to fill the container, cutting off parts of the product photo. On desktop (`md:aspect-auto md:flex-1`), the image stretches to fill the available height which makes the cropping worse.

### Expected behaviour

The product image should be fully visible without cropping — the entire image should be shown, letterboxed if needed.

### Fix

**File:** `components/ProductDetailModal.tsx` (line 87)

```tsx
// Before:
className="object-cover"

// After:
className="object-contain"
```

This will show the full image within the container, adding empty space (filled by the `bg-surface` parent) rather than cropping.

Also on mobile, `aspect-[4/3]` is fine. On desktop, `md:aspect-auto md:flex-1` makes the container fill the left half. With `object-contain`, the image will be centered inside this space.

### Edge cases
- Images with unusual aspect ratios (very wide/tall) will show more letterboxing — this is acceptable as the full image is always visible.
- The thumbnail strip at the bottom (`components/ProductDetailModal.tsx` lines 121-141) uses `object-cover` on small 14x14 thumbnails — leave those as `object-cover` since thumbnails should be cropped for consistency.

---

## Bug 10 — Add "Add to Cart" and "Buy Now" buttons in ProductDetailModal

### Current behaviour

`components/ProductDetailModal.tsx` (lines 204-229) has a single button:
- For in-stock: "Add to Cart" (calls `addToCart`)
- For pre-orders: "Pre-order Now" (also calls `addToCart`)
- For out-of-stock: "Out of Stock" (disabled)

After clicking "Add to Cart", the user must manually open the cart drawer and click "Checkout" — there's no direct path to checkout from the modal.

### Expected behaviour

Two buttons side by side:
1. **"Add to Cart"** — adds item to cart, stays on page (existing behaviour). Shows brief feedback (e.g., button text changes to "Added!" for 1 second).
2. **"Buy Now"** / **"Checkout"** — adds item to cart AND navigates directly to `/checkout/details`.

For pre-orders, labels become:
1. **"Pre-order"** — adds to cart
2. **"Pre-order & Checkout"** — adds to cart and goes to checkout

### Fix

**File:** `components/ProductDetailModal.tsx`

1. Import `useRouter` and `useAuth`:
   ```tsx
   import { useRouter } from 'next/navigation';
   import { useAuth } from '@/context/AuthContext';
   ```

2. Add state and handler:
   ```tsx
   const router = useRouter();
   const { user } = useAuth();
   const [addedFeedback, setAddedFeedback] = useState(false);

   const handleBuyNow = () => {
     if (isOutOfStock) return;
     addToCart(product);
     onClose();
     if (!user) {
       // Auth modal will be triggered by the checkout page redirect
       router.push('/checkout/details');
     } else {
       router.push('/checkout/details');
     }
   };

   const handleAddToCart = () => {
     if (isOutOfStock) return;
     addToCart(product);
     setAddedFeedback(true);
     setTimeout(() => setAddedFeedback(false), 1500);
   };
   ```

3. Replace the single button (lines 204-229) with two buttons:
   ```tsx
   <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
     {/* Add to Cart */}
     <button
       onClick={handleAddToCart}
       disabled={isOutOfStock}
       className="px-8 py-4 font-display font-bold uppercase tracking-wider border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 ..."
     >
       {addedFeedback ? (
         <><Check size={18} /> Added!</>
       ) : isOutOfStock ? (
         <><X size={18} /> Out of Stock</>
       ) : isPreOrder ? (
         <><ShoppingCart size={18} /> Pre-order</>
       ) : (
         <><ShoppingCart size={18} /> Add to Cart</>
       )}
     </button>

     {/* Buy Now / Checkout */}
     {!isOutOfStock && (
       <button
         onClick={handleBuyNow}
         className="px-8 py-4 font-display font-bold uppercase tracking-wider bg-accent text-white hover:bg-white hover:text-black transition-all glow-orange flex items-center justify-center gap-2 ..."
       >
         {isPreOrder ? (
           <><ArrowRight size={18} /> Pre-order & Checkout</>
         ) : (
           <><ArrowRight size={18} /> Buy Now</>
         )}
       </button>
     )}
   </div>
   ```

4. Import `Check` from lucide-react (already imported `ArrowRight`).

### Edge cases
- If user is not logged in, the checkout details page already redirects to `/` — the auth flow should handle this. Consider showing an AuthModal instead if the user isn't logged in (check how CartDrawer handles this at line 23-27).
- "Buy Now" should not add duplicate items — `addToCart` in CartContext should handle incrementing quantity if the item is already in cart.
- The "Added!" feedback should reset if the user clicks again.

---

## File Structure Summary

| File | Changes |
|------|---------|
| `app/admin/page.tsx` | Bug 1: Restructure PO button ternary; Bug 6: Add unlist/re-list for in-stock products; Bug 7: Replace `confirm()` with ConfirmModal |
| `components/ProductCard.tsx` | Bug 2: Add image carousel with arrows; Bug 8: "Only Few Left" text |
| `components/AssetManager.tsx` | Bug 3: Mobile-friendly overlay; Bug 4: Bulk select & delete; Bug 7: Replace `confirm()` |
| `app/checkout/details/page.tsx` | Bug 5: Replace Shiprocket with flat-rate |
| `lib/constants.ts` | Bug 5: Add `FLAT_SHIPPING_RATE` |
| `app/api/shipping/calculate/route.ts` | Bug 5: **Delete** |
| `components/admin/ConfirmModal.tsx` | Bug 7: **New file** — reusable confirmation modal |
| `components/ProductDetailModal.tsx` | Bug 9: `object-cover` → `object-contain`; Bug 10: Add "Buy Now" button; Bug 8: "Only Few Left" text |

## Completion Criteria

- [ ] Unlisting a PO product still shows the Arrived+WA button
- [ ] Re-listing shows both Arrived+WA and Unlist buttons as before
- [ ] Product cards with multiple images show left/right arrows on hover
- [ ] Product cards with single image behave unchanged
- [ ] Asset Manager delete button is visible and tappable on mobile
- [ ] Asset Manager modal doesn't clip on small screens
- [ ] Assets can be multi-selected and bulk deleted from the standalone asset manager
- [ ] "Select All" toggles all assets
- [ ] Checkout no longer calls Shiprocket API
- [ ] Flat shipping rate displays correctly for in-stock orders
- [ ] Pre-order shipping remains free
- [ ] No references to Shiprocket remain in the codebase
- [ ] In-stock products have Unlist/Re-list toggle button in admin
- [ ] Unlisted in-stock products show dimmed with "Unlisted" badge
- [ ] All `confirm()` calls replaced with styled ConfirmModal
- [ ] ConfirmModal has danger/default variants
- [ ] ProductCard shows "Only Few Left" (no exact number) when stock <= 5
- [ ] ProductDetailModal shows "Only Few Left" / "In Stock" (no exact number)
- [ ] Product image in modal shows full image without cropping (`object-contain`)
- [ ] ProductDetailModal has "Add to Cart" + "Buy Now" buttons side by side
- [ ] "Buy Now" adds to cart and navigates to checkout
- [ ] "Add to Cart" shows brief "Added!" feedback
- [ ] Pre-order variants show "Pre-order" and "Pre-order & Checkout"
