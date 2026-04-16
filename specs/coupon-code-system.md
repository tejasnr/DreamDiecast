# Coupon Code System

## Overview

A full coupon/promo code system for DreamDiecast that allows the admin to create, manage, and deactivate coupon codes from the admin dashboard, and allows customers to apply coupon codes during checkout to receive discounts or free shipping.

---

## 1. Data Model

### New Convex Table: `coupons`

```ts
// convex/schema.ts — new table
coupons: defineTable({
  code: v.string(),                    // e.g. "FREESHIP", "DREAM10" — stored UPPERCASE, unique
  description: v.optional(v.string()), // admin-facing note, e.g. "Instagram promo May 2026"

  // --- Discount type (exactly one must be set) ---
  discountType: v.union(
    v.literal("percentage"),           // e.g. 10% off subtotal
    v.literal("flat"),                 // e.g. ₹150 off subtotal
    v.literal("free_shipping"),        // waives shipping fee entirely
  ),
  discountValue: v.optional(v.number()), // required for percentage / flat; ignored for free_shipping

  // --- Constraints ---
  minOrderAmount: v.optional(v.number()),   // minimum subtotal required to apply (₹)
  maxDiscountAmount: v.optional(v.number()), // cap for percentage discounts (₹), e.g. "10% off up to ₹200"
  usageLimit: v.optional(v.number()),        // total redemptions allowed (null = unlimited)
  perUserLimit: v.optional(v.number()),      // max uses per user (null = unlimited, typically 1)
  timesUsed: v.number(),                     // counter — starts at 0

  // --- Validity window ---
  validFrom: v.optional(v.number()),  // epoch ms — coupon active from (null = immediately)
  validUntil: v.optional(v.number()), // epoch ms — coupon expires at (null = never)

  // --- Scope filters (all optional — empty = applies to everything) ---
  applicableBrands: v.optional(v.array(v.string())),     // e.g. ["Mini GT", "Hot Wheels"]
  applicableCategories: v.optional(v.array(v.string())), // e.g. ["JDM Legends"]
  applicableListingTypes: v.optional(                     // restrict to in-stock / pre-order
    v.array(v.union(v.literal("in-stock"), v.literal("pre-order")))
  ),

  // --- Status ---
  isActive: v.boolean(), // admin toggle — overrides everything
})
  .index("by_code", ["code"])
  .index("by_isActive", ["isActive"]),
```

### New Convex Table: `couponRedemptions`

Tracks every time a coupon is used — enables per-user limit enforcement and analytics.

```ts
couponRedemptions: defineTable({
  couponId: v.id("coupons"),
  userId: v.id("users"),
  orderId: v.id("orders"),
  code: v.string(),
  discountApplied: v.number(),    // actual ₹ amount deducted
  shippingWaived: v.optional(v.boolean()),
  redeemedAt: v.number(),         // epoch ms
})
  .index("by_couponId", ["couponId"])
  .index("by_userId", ["userId"])
  .index("by_userId_couponId", ["userId", "couponId"]),
```

### Orders Table Update

Add optional coupon fields to the existing `orders` table:

```ts
// Add to orders schema
couponCode: v.optional(v.string()),
couponDiscount: v.optional(v.number()),       // ₹ amount deducted from subtotal
couponShippingWaived: v.optional(v.boolean()), // true if coupon removed shipping
```

---

## 2. File Structure

### New Files

| File | Purpose |
|------|---------|
| `convex/coupons.ts` | All Convex queries/mutations for coupon CRUD, validation, and redemption |
| `components/admin/CouponManager.tsx` | Admin panel tab component — list, create, edit, toggle, delete coupons |
| `components/admin/CouponForm.tsx` | Modal/form for creating/editing a coupon |
| `components/checkout/CouponInput.tsx` | Customer-facing coupon code input + apply button for checkout |

### Modified Files

| File | Change |
|------|--------|
| `convex/schema.ts` | Add `coupons` and `couponRedemptions` tables; add coupon fields to `orders` |
| `convex/orders.ts` | Accept coupon data in `create` action; record redemption on successful order |
| `app/admin/page.tsx` | Add "Coupons" tab to admin navigation |
| `app/checkout/details/page.tsx` | Integrate `CouponInput` component into order summary |
| `app/checkout/page.tsx` | Pass coupon discount into order creation; display adjusted totals |
| `context/CartContext.tsx` | Add coupon state (`appliedCoupon`, `couponDiscount`, `setCoupon`, `clearCoupon`) |
| `lib/constants.ts` | Add coupon-related display constants if needed |

---

## 3. Core Architecture

### 3.1 Convex Functions (`convex/coupons.ts`)

#### Queries

- **`list`** — Returns all coupons (admin only, auth-gated). Sorted by `_creationTime` desc.
- **`getByCode`** — Lookup a single coupon by code (used during validation).
- **`getStats`** — Returns aggregate stats: total active coupons, total redemptions this month, top 5 most-used codes.

#### Mutations

- **`create`** — Admin creates a new coupon. Validates:
  - Code is unique (case-insensitive, stored uppercase)
  - `discountValue` is required and > 0 for `percentage` / `flat` types
  - `percentage` value must be 1–100
  - `validFrom` < `validUntil` if both set
- **`update`** — Admin edits an existing coupon. Same validations. Cannot change `code` after creation (to preserve redemption history integrity).
- **`toggleActive`** — Flip `isActive` on/off.
- **`remove`** — Hard-delete a coupon (only if `timesUsed === 0`; otherwise soft-disable via `isActive = false`).

#### Validation Function (internal, reusable)

- **`validateCoupon`** — Called server-side during checkout. Accepts `{ code, userId, cartItems, subtotal }`. Returns either `{ valid: true, discountType, discountAmount, shippingWaived, message }` or `{ valid: false, reason }`.

**Validation rules (in order):**

1. Coupon exists → else "Invalid coupon code"
2. `isActive === true` → else "This coupon is no longer active"
3. `validFrom <= now <= validUntil` → else "This coupon has expired" or "This coupon is not yet active"
4. `usageLimit` not exceeded (`timesUsed < usageLimit`) → else "This coupon has reached its usage limit"
5. `perUserLimit` not exceeded (count `couponRedemptions` for this user + coupon) → else "You've already used this coupon"
6. `minOrderAmount <= subtotal` → else "Minimum order of ₹{minOrderAmount} required"
7. Scope filters: if `applicableBrands`/`applicableCategories`/`applicableListingTypes` are set, at least one cart item must match → else "This coupon doesn't apply to items in your cart"

**Discount calculation:**

- `percentage`: `Math.min(subtotal * discountValue / 100, maxDiscountAmount ?? Infinity)`
- `flat`: `Math.min(discountValue, subtotal)` — discount cannot exceed subtotal
- `free_shipping`: discount = 0 on subtotal, but `shippingWaived = true`

#### Redemption (called inside `orders.ts` → `insertOrder`)

- **`recordRedemption`** — Internal mutation. Creates `couponRedemptions` entry + increments `coupons.timesUsed`.

### 3.2 Cart Context Updates (`context/CartContext.tsx`)

Add to CartContext state:

```ts
appliedCoupon: {
  code: string;
  discountType: "percentage" | "flat" | "free_shipping";
  discountAmount: number;  // ₹ off subtotal (0 for free_shipping)
  shippingWaived: boolean;
  message: string;         // e.g. "10% off applied! You saved ₹150"
} | null;
setCoupon: (coupon: ...) => void;
clearCoupon: () => void;
```

- Coupon state persists in `localStorage` alongside cart (so it survives page refreshes)
- `clearCart()` also calls `clearCoupon()`
- When cart items change (add/remove/quantity), **re-validate** the coupon silently — if it's no longer valid (e.g., subtotal dropped below minimum), auto-clear and show a toast

### 3.3 Checkout Flow Integration

#### Details Page (`/checkout/details`)

1. After the order summary (items + subtotal + shipping), render `<CouponInput />`
2. `CouponInput` has:
   - Text input (auto-uppercase, trimmed)
   - "Apply" button → calls `validateCoupon` query
   - On success: shows green confirmation banner with discount details (e.g., "DREAM10 applied — ₹150 off!" or "FREESHIP applied — Free shipping!")
   - On failure: shows red inline error with the reason
   - "Remove" button appears when a coupon is applied → clears coupon state
3. If coupon is `free_shipping` type:
   - Override `shippingCharges` to 0 regardless of cart contents
   - Show "Free Shipping (coupon)" instead of "₹100"
4. Updated totals reflect coupon discount immediately

#### Payment Page (`/checkout`)

1. Display applied coupon in order summary:
   - Line item: `Coupon (CODE)  -₹XXX` or `Shipping  ₹0 (Free — coupon)`
2. Final `totalAmount` passed to `orders.create`:
   - `totalAmount = subtotal - couponDiscount + effectiveShippingCharges`
   - Where `effectiveShippingCharges = shippingWaived ? 0 : shippingCharges`
3. Pass `couponCode`, `couponDiscount`, `couponShippingWaived` to the order creation action
4. Inside `insertOrder` (server-side):
   - **Re-validate** the coupon one final time (prevent race conditions / expired coupons)
   - If still valid → create order + call `recordRedemption`
   - If invalid → reject order with error "Coupon is no longer valid, please try again"

### 3.4 Admin Panel — Coupon Manager

#### Tab Addition

Add a **"Coupons"** tab to the admin page (`app/admin/page.tsx`) alongside Dashboard, Products, Pre-Orders. Use the `Tag` icon from lucide-react.

#### `CouponManager.tsx` — Layout

**Header section:**
- Title: "Coupon Codes"
- Stats row: Active Coupons count | Total Redemptions | Top Code
- "Create Coupon" button (opens form modal)

**Coupon list (table/card view):**

| Column | Details |
|--------|---------|
| Code | Bold, monospace, e.g. `DREAM10` |
| Type | Badge — "10% Off" / "₹150 Off" / "Free Shipping" |
| Constraints | Min order, max discount, scope filters — compact display |
| Usage | `12 / 50 used` or `7 used (unlimited)` |
| Validity | Date range or "Always valid" |
| Status | Active (green) / Inactive (red) toggle switch |
| Actions | Edit, Toggle, Delete |

**Empty state:** "No coupons yet. Create your first coupon to start offering discounts."

#### `CouponForm.tsx` — Create/Edit Modal

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Coupon Code | Text input | Auto-uppercase, alphanumeric + hyphens only, 3–20 chars. Disabled on edit. |
| Description | Text input (optional) | Admin note |
| Discount Type | Select/radio | "Percentage Off" / "Flat Amount Off" / "Free Shipping" |
| Discount Value | Number input | Shown for percentage/flat only. Label changes: "Percentage (%)" or "Amount (₹)" |
| Min Order Amount | Number input (optional) | "Minimum cart subtotal to use this coupon" |
| Max Discount Cap | Number input (optional) | Shown for percentage only. "Maximum discount amount (₹)" |
| Usage Limit | Number input (optional) | "Total times this coupon can be used (leave empty for unlimited)" |
| Per User Limit | Number input (optional) | "Times a single user can use this (leave empty for unlimited)" — default suggestion: 1 |
| Valid From | Date picker (optional) | |
| Valid Until | Date picker (optional) | |
| Applicable Brands | Multi-select (optional) | Populated from `BRANDS` constant |
| Applicable Categories | Multi-select (optional) | Populated from `CATEGORIES` constant |
| Applicable Listing Types | Checkbox: In-Stock / Pre-Order (optional) | |
| Active | Toggle | Default: true |

**Preview card:** Below the form, show a live preview of what the coupon looks like:
> `DREAM10` — 10% off (up to ₹200) on orders above ₹500. Valid until May 30, 2026.

---

## 4. `CouponInput` Component (Customer-facing)

### Design

Fits the existing dark/premium DreamDiecast aesthetic:

```
┌─────────────────────────────────────────────┐
│  🏷 Have a coupon code?                      │
│  ┌──────────────────────┐  ┌──────────┐     │
│  │  Enter code...       │  │  Apply   │     │
│  └──────────────────────┘  └──────────┘     │
│                                              │
│  ✓ DREAM10 applied — You saved ₹150!        │  ← success state (green)
│  [Remove]                                    │
│                                              │
│  ✗ Minimum order of ₹500 required            │  ← error state (red)
└─────────────────────────────────────────────┘
```

### States

1. **Default** — Collapsed "Have a coupon code?" link. Clicking expands the input.
2. **Expanded** — Input + Apply button. Loading spinner during validation.
3. **Applied** — Green success banner with discount summary + Remove button. Input hidden.
4. **Error** — Red error message below input. Input stays visible for retry.

---

## 5. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Coupon code doesn't exist | "Invalid coupon code" |
| Coupon expired mid-checkout | Re-validation at order creation rejects it; user sees "Coupon is no longer valid" |
| Usage limit hit between apply and order submit | Same server-side re-validation catches this |
| Cart changes make coupon invalid (subtotal drops below minimum) | Auto-clear coupon with toast: "Coupon removed — your cart no longer meets the minimum" |
| Multiple coupons | **Not supported in v1** — only one coupon per order. Clear previous before applying new. |
| Coupon + pre-order free shipping | Coupon discount stacks. If coupon is `free_shipping` but cart is all pre-orders (already free shipping), show "Shipping is already free for pre-orders" — coupon still applies if it has a discount component, otherwise show "This coupon doesn't provide additional savings" |
| Balance payment orders (pre-order final payment) | Coupons are **not applicable** to balance payments — disable coupon input on balance payment flow |
| Admin deletes a coupon that was already applied to an in-flight checkout | Server re-validation at order creation catches it |
| Case sensitivity | All codes stored/compared as uppercase. Input auto-uppercased. |
| Empty/whitespace code submission | Client-side validation: "Please enter a coupon code" |
| Coupon with scope filters but cart has mixed items | Discount applies only to qualifying items' subtotal (not the full cart). E.g., if coupon is for "Mini GT" only, percentage/flat discount is calculated against Mini GT items' subtotal only. |
| `free_shipping` coupon on pre-order-only cart | Shipping is already free → coupon accepted but no additional effect. Show info message. |

---

## 6. Order Display Updates

### Order Confirmation (post-checkout)
- Show coupon line item if applied: `Coupon (DREAM10): -₹150`

### Admin Orders Page
- Show coupon badge on orders that used a coupon
- Order detail view shows: coupon code, discount amount, whether shipping was waived

### Admin Dashboard (DashboardHub)
- Add a small "Coupon Redemptions" metric card showing total redemptions this month

---

## 7. Completion Criteria

- [ ] `coupons` and `couponRedemptions` tables added to Convex schema
- [ ] `orders` table updated with optional coupon fields
- [ ] `convex/coupons.ts` — full CRUD + validation + redemption logic
- [ ] `convex/orders.ts` — accepts and stores coupon data; re-validates server-side; records redemption
- [ ] `CouponManager.tsx` — admin can list, create, edit, toggle, delete coupons
- [ ] `CouponForm.tsx` — full form with all fields, live preview, validations
- [ ] `CouponInput.tsx` — customer-facing apply/remove UI with all 4 states
- [ ] `CartContext.tsx` — coupon state added, persisted in localStorage, auto-cleared on cart changes
- [ ] `/checkout/details` — coupon input integrated, totals update live
- [ ] `/checkout` — coupon reflected in final total, passed to order creation
- [ ] Server-side re-validation at order creation time (no stale coupons)
- [ ] Scope-filtered coupons calculate discount only against qualifying items
- [ ] Balance payment flow has coupon input disabled
- [ ] Admin orders view shows coupon info on applicable orders
- [ ] Edge cases from section 5 handled
