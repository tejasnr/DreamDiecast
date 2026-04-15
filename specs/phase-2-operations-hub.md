# Phase 2: Operations Hub (The New Root Dashboard)

**Goal:** Replace the current product grid + pre-order table on `/admin` with a high-level analytics and operations dashboard that gives an instant pulse on the business.

**Depends on:** Phase 1 (campaign fields and financial rollups on `products` table).

---

## Current State

- `/app/admin/page.tsx` — Two-tab layout: "Products" tab (grid of product cards with edit/delete/status toggle) and "Pre-Orders" tab (product list + customer PO table).
- No analytics, no financial overview, no alert system.
- Product management and pre-order tracking are mixed into one page.

---

## Architecture

The root `/admin` route becomes the **Operations Hub**. Product management moves to a dedicated tab or stays accessible via the existing Products tab (which gets pushed to a secondary position). The dashboard is the first thing the admin sees on login.

### Route Structure

```
/admin                → Operations Hub (new default view)
/admin?tab=products   → Existing product management (kept as-is, just a tab)
/admin?tab=pre-orders → Existing pre-order table (kept as-is, just a tab)
```

The page will have 3 tabs: **Dashboard** (default) | **Products** | **Pre-Orders**

---

## New Convex Queries

### 2.1 `getDashboardMetrics` (New Query)

**File:** `convex/analytics.ts` (new file)

```
getDashboardMetrics({ workosUserId: string })
```

**Returns:**

```typescript
{
  totalRevenue: number,        // Sum of all orders with paymentStatus === "verified" totalAmount
                               // + Sum of all preOrders with deposit_verified/balance_verified depositPaid amounts
  lockedDues: number,          // Sum of products.totalLockedBalances across all active pre-order products
                               // (or recalculate: sum balanceAmount from preOrders where status in
                               // [deposit_verified, stock_arrived] and balancePaymentStatus !== "verified")
  averageOrderValue: number,   // totalRevenue / (count of verified orders + count of verified pre-orders)
  totalOrders: number,         // Count of all non-cancelled orders + pre-orders
}
```

**Implementation:** This query reads from multiple tables. Use `ctx.db.query(...)` for each and aggregate in-memory. Convex live queries will re-run when any underlying row changes — this is fine for a dashboard that benefits from real-time updates.

### 2.2 `getAlerts` (New Query)

**File:** `convex/analytics.ts`

```
getAlerts({ workosUserId: string })
```

**Returns:**

```typescript
Array<{
  type: "balance_not_requested" | "sold_out" | "pending_verification",
  productId: Id<"products">,
  productName: string,
  message: string,
  severity: "critical" | "warning",
}>
```

**Alert conditions:**

1. **Balance Not Requested** (critical): Products where `procurementStage === "inventory_ready"` AND `balanceRequestsSent !== true`. Message: `"{productName} is in-hand but balance requests haven't been sent."`
2. **Sold Out** (warning): Products where `listingType === "pre-order"` AND `unitsSold >= allocatedStock` AND `status !== "unlisted"`. Message: `"{productName} is fully sold — consider restocking or checking the waitlist."`
3. **Pending Verification** (warning): Count of orders with `paymentStatus === "submitted"`. This is a single alert, not per-product. Message: `"{count} orders awaiting payment verification."`

### 2.3 `getTopPerformers` (New Query)

**File:** `convex/analytics.ts`

```
getTopPerformers({ workosUserId: string, limit: number })
```

**Returns:**

```typescript
Array<{
  productId: Id<"products">,
  productName: string,
  revenue: number,           // Total revenue from verified orders + deposits
  unitsSold: number,
  image: string,
}>
```

**Implementation:**
1. Query all pre-order products with `listingType === "pre-order"` and active status.
2. For each, calculate revenue as `totalDepositsCollected + (verified balance payments)`.
3. Also query regular orders, group by productId (from `items` array), sum revenue.
4. Merge both lists, sort descending by revenue, take top `limit`.

**Performance note:** For a small catalog (<500 products), in-memory aggregation is fine. If scale becomes an issue later, denormalize `totalRevenue` onto the product.

---

## UI Components

### 2.4 Dashboard Layout

**File:** `app/admin/page.tsx` (modify existing)

```
┌──────────────────────────────────────────────────────────┐
│  [Dashboard]  [Products]  [Pre-Orders]          tabs     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ Total       │ │ Locked      │ │ Average     │        │
│  │ Revenue     │ │ Dues        │ │ Order Value │        │
│  │ ₹12,45,000  │ │ ₹3,20,000  │ │ ₹2,450     │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                          │
│  ┌───────────────────────┐  ┌──────────────────────────┐ │
│  │ Attention Required    │  │ Top Performers           │ │
│  │                       │  │                          │ │
│  │ 🔴 GT-R Nismo is     │  │ 1. Supra A80  ₹1,20,000│ │
│  │   in-hand — send      │  │ 2. NSX Type-R ₹95,000  │ │
│  │   balance requests    │  │ 3. R34 GTR    ₹88,000  │ │
│  │                       │  │ 4. RX-7 FD    ₹72,000  │ │
│  │ 🟡 AE86 fully sold   │  │ 5. 240Z       ₹65,000  │ │
│  │   — check waitlist    │  │                          │ │
│  └───────────────────────┘  └──────────────────────────┘ │
│                                                          │
│  Quick Links:                                            │
│  [→ Orders (3 pending)]  [→ Fulfillment]  [→ Campaigns] │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 2.5 New Components

**File:** `components/admin/DashboardHub.tsx` (new)

The main dashboard panel rendered when the "Dashboard" tab is active.

```typescript
// Uses:
const metrics = useQuery(api.analytics.getDashboardMetrics, { workosUserId });
const alerts = useQuery(api.analytics.getAlerts, { workosUserId });
const topPerformers = useQuery(api.analytics.getTopPerformers, { workosUserId, limit: 5 });
```

**Sub-components (inline or extracted as needed):**

1. **MetricCard** — Reusable card showing a label, value (₹-formatted), and optional trend indicator.
2. **AlertsList** — Renders alerts with severity-based styling:
   - Critical: red left border, bold text.
   - Warning: amber left border.
   - Each alert links to the relevant product or page.
3. **TopPerformersList** — Numbered list with product image thumbnail, name, and revenue. Simple list, no chart library needed (a horizontal bar using Tailwind widths is sufficient).
4. **QuickLinks** — Row of navigation cards to Orders (with pending badge), Fulfillment, and Campaigns pages.

---

## File Structure

```
convex/
  analytics.ts                      — NEW (getDashboardMetrics, getAlerts, getTopPerformers)

app/admin/
  page.tsx                          — MODIFY (add Dashboard tab as default, keep Products/Pre-Orders tabs)

components/admin/
  DashboardHub.tsx                  — NEW (dashboard layout with metrics, alerts, top performers)
```

---

## Edge Cases & Error Handling

1. **Empty state:** When there are no orders or pre-orders, show ₹0 for metrics and a friendly "No data yet" message instead of empty widgets.
2. **Loading state:** Convex queries return `undefined` while loading. Show skeleton placeholders for each metric card and list.
3. **Division by zero:** AOV calculation must guard against zero orders.
4. **Stale rollups:** If `totalLockedBalances` on a product drifts from reality (e.g., due to a bug or manual DB edit), the `lockedDues` metric will be inaccurate. Consider adding a "Recalculate" admin action that recomputes rollups from source pre-orders. This is a nice-to-have, not a blocker.
5. **Alert fatigue:** Cap alerts at 10 items max. If there are more, show "and X more..." with a link to the full list.

---

## Completion Criteria

- [ ] `convex/analytics.ts` exists with `getDashboardMetrics`, `getAlerts`, `getTopPerformers` queries.
- [ ] `/admin` route defaults to the Dashboard tab.
- [ ] Financial Pulse row shows Total Revenue, Locked Dues, and AOV with live data.
- [ ] Alerts widget shows critical and warning items, linked to actionable pages.
- [ ] Top Performers list shows top 5 products by revenue.
- [ ] Quick Links navigate to Orders, Fulfillment, and Campaigns pages.
- [ ] Products and Pre-Orders tabs still function exactly as before.
- [ ] All widgets handle loading and empty states gracefully.
