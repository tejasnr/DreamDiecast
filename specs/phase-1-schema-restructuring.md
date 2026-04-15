# Phase 1: Database Schema & Logic Restructuring (Convex)

**Goal:** Shift from a customer-centric pre-order model to a product-centric campaign architecture, enabling batch operations on all orders tied to a single product.

---

## Current State

- **`products` table**: Flat fields (`isPreorder`, `bookingAdvance`, `totalFinalPrice`, `eta`, `stock`). No concept of "allocated stock vs. sold units" or procurement tracking.
- **`preOrders` table**: Each row is a single customer's pre-order. Status tracks individual fulfillment (`deposit_submitted` → `deposit_verified` → `stock_arrived` → ...). No product-level aggregation.
- **Pain point**: To update all customers for a product (e.g., "stock arrived"), the admin must manually trigger per-customer actions or use the `markArrivedByProduct` mutation which only sets `stock_arrived` status.

---

## Schema Changes

### 1.1 Add Campaign Fields to `products` Table

Add these fields directly to the existing `products` table (no separate campaigns table needed since there's a 1:1 relationship between a product and its pre-order campaign).

```typescript
// convex/schema.ts — additions to `products` defineTable({...})

// Campaign fields (only relevant when listingType === "pre-order")
allocatedStock: v.optional(v.number()),       // Total units available for this campaign
unitsSold: v.optional(v.number()),            // Units sold so far (incremented on PO creation)

procurementStage: v.optional(v.union(
  v.literal("brand_ordered"),
  v.literal("international_transit"),
  v.literal("customs_processing"),
  v.literal("inventory_ready")
)),

// Financial rollups (denormalized for fast dashboard reads)
totalDepositsCollected: v.optional(v.number()),   // Sum of all verified deposits (₹)
totalLockedBalances: v.optional(v.number()),       // Sum of all pending balances (₹)

// Track whether balance request emails have been sent for this campaign
balanceRequestsSent: v.optional(v.boolean()),
```

**New index:**

```typescript
.index("by_listingType", ["listingType"])   // Fast filter for pre-order products
```

**Migration note:** Existing pre-order products will have `procurementStage: undefined`. The UI should treat `undefined` as "Not Started" and allow the admin to set the initial stage.

### 1.2 Add Waitlist Table

Create a new `waitlist` table (not an array on products — arrays don't scale and can't be queried independently).

```typescript
waitlist: defineTable({
  email: v.string(),
  productId: v.id("products"),
  createdAt: v.number(),
  notified: v.optional(v.boolean()),  // Set true when restock notification sent
})
  .index("by_productId", ["productId"])
  .index("by_email", ["email"])
  .index("by_productId_email", ["productId", "email"]),  // Prevent duplicates
```

---

## New & Modified Mutations

### 1.3 `updateCampaignStage` (New Mutation)

**File:** `convex/products.ts`

**Purpose:** When admin updates a product's procurement stage, batch-update all linked pre-orders.

```
Signature:
  updateCampaignStage({
    productId: Id<"products">,
    newStage: "brand_ordered" | "international_transit" | "customs_processing" | "inventory_ready"
  })
```

**Logic:**

1. Auth check: caller must be admin.
2. Fetch the product, validate it exists and `listingType === "pre-order"`.
3. Update `product.procurementStage` to `newStage`.
4. Query all `preOrders` where `productId === productId` and status is NOT terminal (`cancelled`, `delivered`, `fully_paid_shipped`).
5. Map the procurement stage to the appropriate pre-order status:
   - `brand_ordered` → `waiting_for_stock`
   - `international_transit` → `waiting_for_stock`
   - `customs_processing` → `waiting_for_stock`
   - `inventory_ready` → `stock_arrived`
6. Batch-update each pre-order's status via `ctx.db.patch(preOrderId, { status: mappedStatus })`.
7. If `newStage === "inventory_ready"`, also set `product.balanceRequestsSent = false` (reset flag so the admin sees the "send balance requests" prompt).
8. Return `{ updatedCount: number }` for UI feedback.

**Important:** This mutation must NOT trigger emails directly. Email sending is a Phase 4 concern triggered separately by the notification engine. The mutation only updates database state.

### 1.4 Modify `preOrders.create` / `preOrders.createManual`

**File:** `convex/preOrders.ts`

After successfully creating a pre-order, increment the product's `unitsSold` counter:

```typescript
await ctx.db.patch(args.productId, {
  unitsSold: (product.unitsSold ?? 0) + 1,
});
```

Also update `totalDepositsCollected` when a deposit is verified (in `updateStatus` or `updateBalancePaymentStatus`).

### 1.5 Modify Deposit/Balance Verification to Update Rollups

**File:** `convex/preOrders.ts`

When `updateStatus` sets status to `deposit_verified`:
```typescript
await ctx.db.patch(preOrder.productId, {
  totalDepositsCollected: (product.totalDepositsCollected ?? 0) + (preOrder.depositPaid ?? preOrder.depositAmount ?? 0),
  totalLockedBalances: (product.totalLockedBalances ?? 0) + (preOrder.balanceAmount ?? ((preOrder.totalPrice ?? 0) - (preOrder.depositPaid ?? preOrder.depositAmount ?? 0))),
});
```

When `updateBalancePaymentStatus` verifies a balance payment:
```typescript
await ctx.db.patch(preOrder.productId, {
  totalLockedBalances: (product.totalLockedBalances ?? 0) - (preOrder.balanceAmount ?? 0),
});
```

### 1.6 Waitlist Mutations (New)

**File:** `convex/waitlist.ts` (new file)

```
joinWaitlist({ email: string, productId: Id<"products"> })
  - Check product exists and is offline/sold-out (unitsSold >= allocatedStock or status === "unlisted")
  - Check no duplicate entry (by_productId_email index)
  - Insert waitlist entry with createdAt: Date.now()

leaveWaitlist({ email: string, productId: Id<"products"> })
  - Delete matching waitlist entry

getWaitlist({ productId: Id<"products"> })
  - Admin-only query
  - Return all waitlist entries for a product, sorted by createdAt

getWaitlistCount({ productId: Id<"products"> })
  - Public query returning just the count (for "X people waiting" display)
```

---

## File Structure

```
convex/
  schema.ts          — MODIFY (add campaign fields to products, add waitlist table)
  products.ts        — MODIFY (add updateCampaignStage mutation)
  preOrders.ts       — MODIFY (increment unitsSold on create, update rollups on verify)
  waitlist.ts        — NEW (joinWaitlist, leaveWaitlist, getWaitlist, getWaitlistCount)
```

---

## Edge Cases & Error Handling

1. **Race condition on `unitsSold`:** Convex mutations are transactional, so concurrent increments are safe. No additional locking needed.
2. **Stock overflow:** `preOrders.create` should check `product.unitsSold < product.allocatedStock` before allowing a new pre-order. If full, return an error suggesting the waitlist.
3. **Rollup drift:** If an admin manually cancels a pre-order after deposit verification, `totalDepositsCollected` and `totalLockedBalances` must be decremented. Add this logic to any cancellation mutation.
4. **Backward compatibility:** Existing pre-order products without `allocatedStock` should be treated as unlimited allocation (no stock check). The admin can set allocation retroactively.
5. **Terminal status guard:** `updateCampaignStage` must skip pre-orders in terminal states (`cancelled`, `delivered`, `fully_paid_shipped`) to avoid resurrecting closed orders.

---

## Completion Criteria

- [ ] `products` table has `allocatedStock`, `unitsSold`, `procurementStage`, `totalDepositsCollected`, `totalLockedBalances`, `balanceRequestsSent` fields.
- [ ] `waitlist` table exists with proper indexes.
- [ ] `updateCampaignStage` mutation batch-updates all active pre-orders for a product.
- [ ] Pre-order creation increments `unitsSold` and rejects when allocation is full.
- [ ] Deposit/balance verification updates financial rollups on the product.
- [ ] Cancellation decrements rollups correctly.
- [ ] All mutations have admin auth checks where appropriate.
- [ ] Existing data continues to work (no breaking changes to current pre-order flow).
