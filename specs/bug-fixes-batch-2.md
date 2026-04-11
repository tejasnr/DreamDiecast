# Bug Fixes & Features — Batch 2

## Overview

Six items: 3 bug fixes, 3 feature additions across admin dashboard, shipping API, product display, and asset management.

---

## 1. PO "Mark as Arrived" → WhatsApp Announcement

### Problem
When admin marks a pre-order product as arrived, there is no quick way to announce it to the WhatsApp community. Currently the PreOrderTable only has per-customer WhatsApp/email buttons — no community-wide announcement.

### Requirements
- Add a dedicated **"Mark as Arrived"** button on pre-order product cards in the admin dashboard (Tab 2 — "Pre-Order Models" section in `/app/admin/page.tsx`)
- When clicked:
  1. Call `products.markArrived` mutation (converts listing from pre-order → in-stock)
  2. Update all related pre-orders to `stock_arrived` status
  3. Open a new tab redirecting to the WhatsApp announcement community with a pre-filled message:
     ```
     🚗 *{Product Name}* has arrived!

     Please make your remaining payments here:
     https://dreamdiecast.in/pre-orders
     ```
  4. The WhatsApp URL format: `https://wa.me/?text={encodeURIComponent(message)}` — or if a community invite link exists, redirect to that link after copying the message to clipboard

### Files to Modify
| File | Change |
|------|--------|
| `app/admin/page.tsx` | Add "Mark as Arrived" button to pre-order product cards with WhatsApp redirect logic |
| `convex/products.ts` | Ensure `markArrived` mutation also batch-updates related pre-orders to `stock_arrived` |
| `convex/preOrders.ts` | Add `markArrivedByProduct` mutation — updates all pre-orders for a given productId to `stock_arrived` |
| `lib/constants.ts` | Add `WHATSAPP_COMMUNITY_LINK` constant (admin should configure this) |

### Data Flow
```
Admin clicks "Mark as Arrived" on product card
  → calls products.markArrived(productId)
  → calls preOrders.markArrivedByProduct(productId)
  → opens WhatsApp web with pre-filled announcement message
```

### Edge Cases
- Product with no pre-orders — still allow marking arrived, skip pre-order update
- WhatsApp community link not configured — fall back to `https://wa.me/?text=...` (generic share)
- Confirm dialog before marking arrived (irreversible action)

---

## 2. Shiprocket API — Fix 500 Error & Auth Failure

### Problem
`POST /api/shipping/calculate` returns 500 with "Failed to authenticate with Shiprocket". Two root causes:

1. **Missing or invalid credentials**: `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` env vars may not be set in the Vercel deployment or are incorrect
2. **No token caching**: Every shipping calculation makes a fresh login call to Shiprocket, which can trigger rate limiting
3. **No graceful error detail**: The error message returned to the client is generic

### Current Code
`/app/api/shipping/calculate/route.ts` — lines 27-37: Shiprocket login call, returns generic error on failure.

### Requirements

#### A. Better error handling & diagnostics
- Log the actual Shiprocket error response body for debugging
- Return more specific error messages to the frontend:
  - Missing credentials → return mock data with `is_mock: true` (already handled)
  - Invalid credentials → `"Shipping calculator temporarily unavailable"` with status 503
  - Rate limited → `"Too many requests, please try again later"` with status 429
  - Serviceability failure → keep current 500 with descriptive message

#### B. Token caching (optional optimization)
- Shiprocket tokens are valid for 10 days
- Cache token in a module-level variable with expiry timestamp
- Reuse cached token; only re-login when expired or on 401 response

#### C. Environment variable verification
- Verify `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` are set in Vercel project environment variables
- Add `.env.example` entry documenting these variables

### Files to Modify
| File | Change |
|------|--------|
| `app/api/shipping/calculate/route.ts` | Improve error handling, add token caching, better error responses |
| `.env.example` (create if missing) | Document `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_POSTCODE` |

### Edge Cases
- Shiprocket API down entirely — return 503 with friendly message
- Token expired mid-session — retry login once, then fail
- Invalid postcode format — validate 6-digit Indian pincode before calling API

---

## 3. Save Product Names & SKUs for Reuse (Admin Autocomplete)

### Problem
When listing a new product, admin has to type the product name and SKU from scratch every time. For repeat listings (same model, different scale/variant), this is tedious and error-prone.

### Requirements
- Store a catalog of previously used product names and SKU numbers
- In the ProductForm, name and SKU fields should show **autocomplete suggestions** from previously used values
- Admin can still type new names/SKUs (combo box behavior — not a strict dropdown)
- Suggestions appear as a dropdown below the input field on focus/typing
- Matching is case-insensitive, partial match (contains)

### Architecture

#### Option A: Derive from existing products (simpler, recommended)
- Query all existing products and extract unique `name` and `sku` values
- No new table needed — use `products.list()` data already loaded on admin page
- Filter client-side for autocomplete suggestions

#### Option B: Dedicated catalog table (if needed later)
- New `productCatalog` table with `name`, `sku`, `brand`, `scale` fields
- Populated automatically when products are created
- More scalable but adds complexity

**Recommendation: Start with Option A.** The admin page already loads all products.

### Files to Modify
| File | Change |
|------|--------|
| `components/admin/ProductForm.tsx` | Add autocomplete/combobox for `name` and `sku` fields |
| `components/admin/AutocompleteInput.tsx` (new) | Reusable autocomplete input component |

### AutocompleteInput Component Spec
```tsx
interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
}
```

- Shows filtered suggestions dropdown on focus when input has text
- Keyboard navigation (arrow keys + enter to select)
- Click to select suggestion
- Escape to close dropdown
- Highlights matching text in suggestions

### Data Flow
```
Admin page loads products → extracts unique names/SKUs
  → passes as suggestions to ProductForm
  → ProductForm passes to AutocompleteInput for name & SKU fields
  → User types → filters suggestions → selects or enters new value
```

### Edge Cases
- No existing products — empty suggestions, behaves as plain input
- Duplicate names with different SKUs — both fields independent
- Very long product names — truncate in dropdown, show full on hover/select

---

## 4. PO Stop Button — Unlist Pre-Order from Site

### Problem
No way to remove/hide a pre-order product from the public site without deleting it entirely. Admin needs a "stop" button to unlist a pre-order while keeping the data.

### Requirements
- Add a **"Stop PO" / "Unlist"** button on pre-order product cards in admin dashboard
- When clicked:
  1. Set product `status` to `"unlisted"` (or equivalent)
  2. Product no longer appears on `/pre-orders` page
  3. Product remains in admin dashboard with visual indicator (e.g., grayed out, "Unlisted" badge)
  4. Reversible — add "Re-list" button to bring it back

### Schema Change
The `products` table already has a `status` field: `v.optional(v.string())`. Use values:
- `"active"` (default / listed)
- `"unlisted"` (hidden from public)

### Files to Modify
| File | Change |
|------|--------|
| `app/admin/page.tsx` | Add "Stop PO" / "Re-list" toggle button on pre-order product cards |
| `convex/products.ts` | Add `unlistProduct` and `relistProduct` mutations (or use existing `update` with status field) |
| `app/pre-orders/page.tsx` | Filter out products with `status === "unlisted"` |
| `components/ProductCard.tsx` | Optionally show "Unlisted" badge in admin context |

### Data Flow
```
Admin clicks "Stop PO"
  → calls products.update(id, { status: "unlisted" })
  → product disappears from /pre-orders page
  → admin sees grayed-out card with "Re-list" button

Admin clicks "Re-list"
  → calls products.update(id, { status: "active" })
  → product reappears on /pre-orders page
```

### Edge Cases
- Existing pre-orders for unlisted product — keep them, don't cancel
- Product with no status field — treat as `"active"` (backward compat)
- Unlisted product should still appear in admin search/filters

---

## 5. Multiple Images — Not Visible on Product Detail

### Problem
Products support multiple images (stored in `images` array), but the `ProductDetailModal` only displays `product.image` (the single cover image). Users can't see additional product photos.

### Current State
- **Schema**: `images: v.optional(v.array(v.string()))` — array exists
- **ProductForm**: Supports uploading up to 10 images, stores in `images` array
- **ProductDetailModal** (`components/ProductDetailModal.tsx` line 70): Only renders `product.image`
- **ProductCard**: Only shows `product.image`

### Requirements
- Add an **image gallery/carousel** to `ProductDetailModal`
- Show all images from `product.images` array
- First image (cover) shown by default
- Navigation: thumbnail strip below main image + left/right arrows
- On mobile: swipe gesture support (optional, nice-to-have)

### Files to Modify
| File | Change |
|------|--------|
| `components/ProductDetailModal.tsx` | Replace single image with gallery carousel |

### Gallery Component Spec
```
┌─────────────────────────────┐
│                             │
│       Main Image            │
│       (large view)          │
│                             │
│   ◄               ►        │  ← Arrow navigation
│                             │
├──┬──┬──┬──┬──┬──┬──┬──┬──┬──┤
│  │  │  │  │  │  │  │  │  │  │  ← Thumbnail strip
│ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│10│
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
```

- Selected thumbnail has border/highlight
- Clicking thumbnail switches main image
- Arrow buttons at edges of main image
- If only 1 image, hide arrows and thumbnail strip (current behavior)
- Fallback to `product.image` if `product.images` is empty/undefined

### Edge Cases
- Product with only `image` field set (no `images` array) — show single image, no gallery
- Product with `images` array but `images[0]` differs from `image` — use `images` array as source of truth
- Broken image URL — show placeholder
- Very many images (10) — thumbnail strip should scroll horizontally

---

## 6. Asset Manager Upload Error — `Cannot read properties of undefined (reading 'query')`

### Problem
Uploading images in Asset Manager fails with:
```
TypeError: Cannot read properties of undefined (reading 'query')
    at getUserByWorkosId (../../convex/_utils.ts:25:0)
```

### Root Cause Analysis
The `assets.create` function is an **action** (not a mutation/query). In Convex actions, `ctx` does NOT have `ctx.db` — actions don't have direct database access. But `requireAdmin` calls `resolveUser` → `getUserByWorkosId`, which does `ctx.db.query(...)`.

**This is the bug**: `requireAdmin` uses `ctx.db.query()` inside an action where `ctx.db` is `undefined`.

### Fix

#### Option A: Pass workosUserId and validate via internal query (recommended)
- Create an `internalQuery` in `_utils.ts` or `users.ts` that validates admin status
- Call it from the action using `ctx.runQuery()`
- Replace direct `requireAdmin(ctx)` call in actions

#### Option B: Use `ctx.runQuery` wrapper in requireAdmin for actions
- Detect if `ctx.db` is undefined and use `ctx.runQuery` instead
- More complex, changes shared utility behavior

**Recommendation: Option A** — cleaner separation of concerns.

### Files to Modify
| File | Change |
|------|--------|
| `convex/_utils.ts` | Add `requireAdminAction` helper or `internalQuery` for admin validation |
| `convex/assets.ts` | Use action-compatible admin check instead of `requireAdmin(ctx)` |

### Proposed Implementation

Add to `convex/_utils.ts` or `convex/users.ts`:
```typescript
// Internal query callable from actions via ctx.runQuery()
export const validateAdmin = internalQuery({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserByWorkosId(ctx, args.workosUserId);
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "admin") throw new Error("Forbidden");
    return user;
  },
});
```

Update `convex/assets.ts` create action:
```typescript
handler: async (ctx, args): Promise<string> => {
  // Use runQuery instead of direct db access
  const workosUserId = args.workosUserId;
  if (!workosUserId) throw new Error("Unauthorized");
  await ctx.runQuery(internal.users.validateAdmin, { workosUserId });
  // ... rest of handler
}
```

### Also Check
- `assets.remove` is a **mutation**, so `requireAdmin(ctx)` works fine there — no change needed
- Any other actions in the codebase using `requireAdmin` — search for `action({` + `requireAdmin` pattern

### Edge Cases
- User not logged in (no workosUserId) — return clear "Please log in" error
- User logged in but not admin — return "Forbidden" (existing behavior)
- WorkOS identity available via `ctx.auth` in actions — check if this works in Convex actions (it does for queries/mutations but needs verification for actions)

---

## Implementation Priority

| # | Item | Severity | Effort |
|---|------|----------|--------|
| 6 | Asset upload error | **Blocker** | Small — fix action/query mismatch |
| 5 | Multiple images not visible | **High** | Medium — add gallery to modal |
| 2 | Shiprocket API error | **High** | Small — error handling + env check |
| 3 | Product name/SKU autocomplete | **Medium** | Medium — new autocomplete component |
| 1 | PO Mark as Arrived → WA announcement | **Medium** | Medium — button + WA redirect |
| 4 | PO Stop/Unlist button | **Medium** | Small — status toggle + filter |

---

## Completion Criteria

- [ ] Asset Manager uploads work without errors
- [ ] Product detail modal shows all uploaded images in a gallery
- [ ] Shiprocket API returns meaningful errors (not generic 500)
- [ ] ProductForm name/SKU fields show autocomplete from existing products
- [ ] "Mark as Arrived" button sends WA community announcement
- [ ] "Stop PO" button unlists product from public pre-orders page
- [ ] All features work on mobile viewports
- [ ] No regressions in existing admin functionality
