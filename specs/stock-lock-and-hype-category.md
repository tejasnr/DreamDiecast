# Stock Locking System & Hype Category

## Problem Statement

### Bug: Overselling due to race conditions
- Product has stock=3. Two simultaneous checkouts each reserve 1 → stock=1. Then two more simultaneous checkouts with only 1 left → **both succeed**. 4 orders placed on 3 stock.
- **Root cause 1:** `insertOrder` (convex/orders.ts) creates orders without verifying stock or checking that a valid reservation exists.
- **Root cause 2:** Same user on multiple devices — second session releases first session's reservation (stockReservations.ts:34-42), restoring stock, then re-reserves. First session still has payment page open and can submit freely.
- **Root cause 3:** `consumeReservation` is called client-side *after* `createOrder` — a separate, non-atomic step. If it fails or the reservation was already stolen, the order still goes through.

### New Feature: "Hype" category
- Admin can tag a product as "Hype" during listing.
- Hype products are limited to **1 quantity per user account**.
- Enforced at cart level, checkout level, and server level.

---

## Architecture

### Part 1: Bulletproof Stock Locking

#### Strategy: Server-side atomic reservation validation at order creation

The fix moves all critical stock validation server-side into a single atomic Convex mutation. The client remains a thin UI layer — it cannot bypass server checks.

#### Files to modify

| File | Changes |
|------|---------|
| `convex/stockReservations.ts` | Add `validateAndConsumeReservation` mutation; modify `reserveStock` to block same-user multi-device |
| `convex/orders.ts` | `insertOrder` validates stock + consumes reservation atomically |
| `convex/schema.ts` | Add `sessionId` field to orders table (for reservation binding) |
| `app/checkout/page.tsx` | Pass `sessionId` to `createOrder`; remove client-side `consumeReservation` call |

#### Detailed Changes

##### 1. `convex/stockReservations.ts` — `reserveStock` hardening

**Current behavior (broken):** When same user opens checkout on device B, it releases device A's reservation and creates a new one. Device A can still submit orders.

**New behavior:**
- When a user already has an active (non-expired) reservation for a product in a *different* session, **do NOT release it**. Instead, **throw an error**: `"You already have an active checkout session. Complete or cancel it first."`
- This prevents same-account multi-device race. Only one checkout session per user at a time.
- If the existing reservation is **expired**, release it normally and proceed.

```
reserveStock handler logic:
1. Query existing reservations for userId
2. Filter to non-expired ones
3. If any exist with a DIFFERENT sessionId AND are NOT expired:
   → throw "You already have an active checkout session"
4. If any exist with SAME sessionId:
   → return existing expiresAt (idempotent, no change)
5. If any exist but ARE expired:
   → release them (restore stock, delete record)
6. Proceed with normal reservation flow
```

##### 2. `convex/orders.ts` — Atomic stock validation at order creation

**Current behavior (broken):** `insertOrder` blindly inserts the order. No stock check. No reservation check.

**New behavior:** `insertOrder` receives `sessionId` and validates:

```
insertOrder handler logic (for each in-stock item):
1. Look up active reservation for this userId + sessionId + productId
2. If NO reservation found:
   → throw "Stock reservation expired or not found. Please try again."
3. If reservation found but EXPIRED (expiresAt < now):
   → Restore stock (product.stock += quantity)
   → Delete reservation
   → throw "Your stock reservation has expired. Please try again."
4. If reservation found and VALID:
   → Delete reservation (consume it — stock already decremented)
   → Continue with order creation
```

This is the **critical server-side gate**. Even if the client is manipulated, no order can be created without a valid, non-expired reservation backing it.

##### 3. `convex/schema.ts` — Add sessionId to orders

```typescript
// Add to orders table definition:
sessionId: v.optional(v.string()),
```

This allows tracing which reservation backed which order (useful for debugging).

##### 4. `app/checkout/page.tsx` — Client changes

- Pass `sessionId: sessionIdRef.current` to the `createOrder` action args.
- **Remove** the separate `consumeReservation` call after order creation (lines 292-299). The server now handles this atomically inside `insertOrder`.
- When `reserveStock` throws "active checkout session" error, show: `"You have another checkout in progress. Complete or cancel it first."`

##### 5. `convex/orders.ts` — `create` action

- Add `sessionId: v.optional(v.string())` to args.
- Pass `sessionId` through to `insertOrder`.

#### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User A & B simultaneously checkout last item | One reservation succeeds, other gets "Insufficient stock" |
| Same user, 2 devices, same account | Second device gets "You already have an active checkout session" |
| User's reservation expires mid-payment | Submit fails with "Reservation expired, please try again" |
| User leaves checkout (unmount/beforeunload) | Stock released via `releaseStock` (existing behavior, unchanged) |
| Scheduled release fires after order completed | Reservation already deleted by `insertOrder`, no-op |
| Cron cleanup runs | Only releases truly expired+unconsumed reservations (existing behavior) |
| Network failure after order created but before client redirect | Order is valid — reservation was consumed atomically server-side |
| Pre-order items | Skip all reservation logic (existing behavior, unchanged) |

---

### Part 2: "Hype" Category (1 per person)

#### Strategy: New boolean flag `isHype` on products + server+client enforcement

#### Files to modify

| File | Changes |
|------|---------|
| `convex/schema.ts` | Add `isHype: v.optional(v.boolean())` to products table |
| `convex/products.ts` | Accept `isHype` in create/update mutations |
| `components/admin/ProductForm.tsx` | Add "Hype" toggle in admin form |
| `context/CartContext.tsx` | Enforce qty=1 for hype products in `addToCart` and `updateQuantity` |
| `components/ProductDetailModal.tsx` | Show "Hype" badge; disable add-to-cart if already purchased |
| `components/ProductGrid.tsx` | Show "Hype" badge on product cards |
| `convex/orders.ts` | Server-side check: reject if user already owns a hype product |
| `convex/stockReservations.ts` | Validate hype limit during reservation |

#### Detailed Changes

##### 1. `convex/schema.ts`

```typescript
// Add to products table:
isHype: v.optional(v.boolean()),
```

##### 2. `convex/products.ts` — create/update

- Add `isHype: v.optional(v.boolean())` to args for both create and update mutations.
- Pass through to DB insert/patch.

##### 3. `components/admin/ProductForm.tsx`

- Add a toggle/checkbox: **"🔥 Hype Drop (1 per person)"**
- Only visible when listing type is "in-stock" (pre-orders don't need this).
- Sets `isHype: true` in the product payload.

##### 4. `context/CartContext.tsx` — Client-side enforcement

**`addToCart`:**
```
If product.isHype:
  - If product already in cart → show toast "Hyped models are limited to 1 per person" → return
  - Else → add with quantity: 1
```

**`updateQuantity`:**
```
If item is hype product AND newQuantity > 1:
  → show toast "Hyped models are limited to 1 per person"
  → clamp to 1
```

##### 5. `components/ProductDetailModal.tsx`

- If `product.isHype`:
  - Show a badge: `"🔥 HYPE DROP — 1 PER PERSON"`
  - If user has already purchased this product (check via query), show "Already Purchased" instead of "Add to Cart"
  - If product is in cart, show "Already in Cart" instead of "Add to Cart"

##### 6. `components/ProductGrid.tsx`

- If `product.isHype`: show a small `"🔥 HYPE"` badge on the product card (top-right corner or similar).

##### 7. `convex/orders.ts` — Server-side enforcement (critical)

**In `insertOrder`, before creating the order:**

```
For each item where the product has isHype === true:
1. Query orders table for this userId where:
   - Any item has this productId
   - orderStatus is NOT "cancelled"
   - paymentStatus is NOT "rejected"
2. If any such order exists:
   → throw "Hyped models are limited to 1 per person. You already have an order for this product."
```

This is the **authoritative check**. Client-side enforcement is UX sugar — this prevents bypass.

##### 8. `convex/stockReservations.ts` — Hype check during reservation

**In `reserveStock`, before decrementing stock:**

```
For each in-stock item:
1. Look up the product
2. If product.isHype === true AND item.quantity > 1:
   → throw "Hyped models are limited to 1 per person"
3. If product.isHype === true:
   → Query orders for this userId + productId (non-cancelled)
   → If exists: throw "You already have an order for this hyped model"
```

#### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User adds hype product to cart, then adds again | Toast: "Hyped models are limited to 1 per person"; quantity stays 1 |
| User manually edits qty in cart to 2 | Clamped to 1 with toast |
| User already ordered hype product, tries again | "Add to Cart" replaced with "Already Purchased" on modal |
| User already ordered but order was cancelled/rejected | Allowed to purchase again (cancelled/rejected orders don't count) |
| User tries to bypass client and hit API directly | `insertOrder` server check blocks it |
| Hype product added to cart + non-hype product | Non-hype product unaffected; hype product locked to qty 1 |
| Admin toggles isHype on existing product | Takes effect immediately for new orders; existing orders unaffected |
| Pre-order product marked as hype | `isHype` toggle only shown for in-stock listing type in admin form. If somehow set on pre-order, enforcement still applies at order creation. |

---

## Data Model Changes Summary

```typescript
// convex/schema.ts additions:

// products table:
isHype: v.optional(v.boolean()),     // Hype category flag

// orders table:
sessionId: v.optional(v.string()),   // Links order to checkout session/reservation
```

No new tables required. No migrations needed (all fields are optional).

---

## Completion Criteria

### Stock locking
- [ ] Two simultaneous checkouts for the last item: exactly one succeeds, other gets "Insufficient stock"
- [ ] Same user, two devices: second device blocked with "active checkout session" error
- [ ] Expired reservation + submit: server rejects with "reservation expired"
- [ ] Order cannot be created without a valid, non-expired reservation (server enforced)
- [ ] `consumeReservation` no longer called from client — handled atomically in `insertOrder`
- [ ] Existing flows (release on unmount, scheduled release, cron cleanup) continue working
- [ ] Pre-order items unaffected by reservation system

### Hype category
- [ ] Admin can toggle "Hype" on in-stock products
- [ ] Hype badge visible on product cards and detail modal
- [ ] Cart enforces qty=1 for hype products (client-side)
- [ ] Server rejects orders where user already purchased a hype product
- [ ] Server rejects reservations where quantity > 1 for hype products
- [ ] Cancelled/rejected orders don't count toward the limit
- [ ] Toast notification: "Hyped models are limited to 1 per person"
- [ ] "Already Purchased" state shown on product modal for returning buyers

---

## Implementation Order

1. **Schema changes** (`convex/schema.ts`) — add `isHype` and `sessionId` fields
2. **Stock locking backend** (`convex/stockReservations.ts`, `convex/orders.ts`) — fix race conditions
3. **Stock locking frontend** (`app/checkout/page.tsx`) — pass sessionId, remove client-side consume
4. **Hype backend** (`convex/products.ts`, `convex/orders.ts`, `convex/stockReservations.ts`) — server enforcement
5. **Hype admin UI** (`components/admin/ProductForm.tsx`) — toggle
6. **Hype customer UI** (`context/CartContext.tsx`, `components/ProductDetailModal.tsx`, `components/ProductGrid.tsx`) — badges, limits, toasts
