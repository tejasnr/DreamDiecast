# Phase 3: Pre-Order Campaign Management UI

**Goal:** Create a dedicated product-centric view for managing pre-order campaigns, replacing the current customer-list approach with batch operations per product.

**Depends on:** Phase 1 (schema: `procurementStage`, `allocatedStock`, `unitsSold`, rollups), Phase 2 (dashboard links to this page).

---

## Current State

- Pre-orders are managed on the `/admin` page under the "Pre-Orders" tab.
- The view shows: (1) a list of pre-order products with "Mark as Arrived" buttons, and (2) a `PreOrderTable` component listing individual customer pre-orders with per-row status dropdowns.
- No visual pipeline/stepper. No batch action buttons. No financial summary per product.

---

## Route

```
/app/admin/campaigns/page.tsx    — NEW route
```

Accessible from:
- Dashboard Hub quick links
- Admin sidebar/nav (add "Campaigns" link)

---

## New Convex Queries

### 3.1 `getCampaigns` (New Query)

**File:** `convex/campaigns.ts` (new file)

```
getCampaigns({ workosUserId: string })
```

**Returns:**

```typescript
Array<{
  product: {
    _id: Id<"products">,
    name: string,
    sku: string,
    image: string,
    brand: string,
    scale: string,
    allocatedStock: number,
    unitsSold: number,
    procurementStage: string | undefined,
    totalDepositsCollected: number,
    totalLockedBalances: number,
    totalFinalPrice: number,
    balanceRequestsSent: boolean,
  },
  preOrderCount: number,
  pendingBalanceCount: number,        // POs in stock_arrived with unverified balance
  verifiedBalanceCount: number,       // POs with balance_verified
  customerEmails: string[],           // For quick reference (not displayed prominently)
}>
```

**Implementation:**
1. Query all products where `listingType === "pre-order"` and `status !== "unlisted"` (or include unlisted with a visual indicator).
2. For each product, query `preOrders` by `productId` index.
3. Aggregate counts by pre-order status.
4. Return combined data.

### 3.2 `getCampaignDetail` (New Query)

**File:** `convex/campaigns.ts`

```
getCampaignDetail({ workosUserId: string, productId: Id<"products"> })
```

**Returns:** Same as one item from `getCampaigns` but includes the full list of pre-orders for that product (for an expandable detail view).

```typescript
{
  product: { ... },
  preOrders: Array<{
    _id: Id<"preOrders">,
    customerName: string,
    customerEmail: string,
    status: string,
    depositPaid: number,
    balanceAmount: number,
    balancePaymentStatus: string,
  }>,
  waitlistCount: number,
}
```

---

## UI Components

### 3.3 Campaign List Page

**File:** `app/admin/campaigns/page.tsx`

Layout:
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard          Pre-Order Campaigns            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [img] Nissan GT-R R35 Nismo — Mini GT 1/64             │  │
│  │                                                        │  │
│  │  Stock: 12 / 20 sold    Pending Balance: ₹48,000      │  │
│  │                                                        │  │
│  │  ○ Ordered ─── ● Transit ─── ○ Customs ─── ○ In-Hand  │  │
│  │                                                        │  │
│  │  [Request Pending Balances]         [View Customers ▾] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [img] Toyota Supra A80 — Tarmac Works 1/64             │  │
│  │                                                        │  │
│  │  Stock: 8 / 8 sold (SOLD OUT)  Pending Balance: ₹0    │  │
│  │                                                        │  │
│  │  ○ Ordered ─── ○ Transit ─── ○ Customs ─── ● In-Hand  │  │
│  │                                                        │  │
│  │  [All Balances Collected ✓]         [View Customers ▾] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 `CampaignCard` Component

**File:** `components/admin/CampaignCard.tsx` (new)

**Props:**
```typescript
{
  product: CampaignProduct,
  preOrderCount: number,
  pendingBalanceCount: number,
  onStageChange: (productId: Id<"products">, stage: ProcurementStage) => void,
  onRequestBalances: (productId: Id<"products">) => void,
}
```

**Sections:**

1. **Header Row:**
   - Product image thumbnail (48x48)
   - Product name, brand, scale, SKU
   - Status pill if sold out

2. **Financial/Stock Summary Row:**
   - `{unitsSold} / {allocatedStock} sold` — Show as a progress bar with text overlay.
   - `Pending Balance: ₹{totalLockedBalances}` — amber text if > 0, muted if 0.

3. **Procurement Stepper:**
   - 4 steps: `Ordered` → `Transit` → `Customs` → `In-Hand`
   - Maps to: `brand_ordered` → `international_transit` → `customs_processing` → `inventory_ready`
   - Visual: Horizontal row of circles connected by lines.
   - Current stage: filled circle + bold label. Past stages: filled + muted. Future: hollow.
   - **Clickable:** Clicking a step opens a confirmation modal: "Move {productName} to {stageName}? This will update all {preOrderCount} customer orders."
   - On confirm: call `updateCampaignStage` mutation (from Phase 1).

4. **Color coding:**
   - `brand_ordered`: neutral/gray
   - `international_transit`: amber fill + amber connecting line
   - `customs_processing`: amber fill
   - `inventory_ready`: green fill + green connecting line

5. **Action Row:**
   - **Primary button:** "Request Pending Balances" — enabled only when `procurementStage === "inventory_ready"` AND `balanceRequestsSent !== true` AND `pendingBalanceCount > 0`. Triggers Phase 4 email batch (disabled/placeholder until Phase 4 is built).
   - **Secondary button:** "Notify Customers" — sends a stage update email (Phase 4).
   - **Expand toggle:** "View Customers ▾" — expands to show a compact table of pre-orders for this product.

6. **Expanded Customer List (collapsible):**
   - Compact table: Name | Email | Deposit | Balance Due | Status
   - No individual actions here — that stays on the existing Pre-Orders tab.

### 3.5 `ProcurementStepper` Component

**File:** `components/admin/ProcurementStepper.tsx` (new)

**Props:**
```typescript
{
  currentStage: "brand_ordered" | "international_transit" | "customs_processing" | "inventory_ready" | undefined,
  onStageClick: (stage: ProcurementStage) => void,
  disabled?: boolean,
}
```

**Rendering logic:**
```
const STAGES = [
  { key: "brand_ordered", label: "Ordered", icon: Package },
  { key: "international_transit", label: "Transit", icon: Plane },
  { key: "customs_processing", label: "Customs", icon: Shield },
  { key: "inventory_ready", label: "In-Hand", icon: CheckCircle },
];

// currentIndex = STAGES.findIndex(s => s.key === currentStage) ?? -1
// For each stage at index i:
//   i < currentIndex  → completed (filled, muted)
//   i === currentIndex → active (filled, bright, pulse animation)
//   i > currentIndex  → upcoming (hollow)
```

**Interaction:** Clicking any step calls `onStageClick(stage.key)`. The parent (`CampaignCard`) handles the confirmation modal before calling the mutation.

**Styling:**
- Completed: `bg-green-500/20 border-green-500 text-green-500`
- Active transit/customs: `bg-amber-500/20 border-amber-500 text-amber-500`
- Active in-hand: `bg-green-500/20 border-green-500 text-green-500`
- Upcoming: `bg-zinc-800 border-zinc-600 text-zinc-500`
- Connecting lines: match the fill state of the left node

---

## File Structure

```
app/admin/
  campaigns/
    page.tsx                        — NEW (campaign list page)

components/admin/
  CampaignCard.tsx                  — NEW (product campaign card)
  ProcurementStepper.tsx            — NEW (horizontal stage stepper)

convex/
  campaigns.ts                      — NEW (getCampaigns, getCampaignDetail queries)
```

---

## Edge Cases & Error Handling

1. **No campaigns:** Show empty state: "No active pre-order campaigns. Create a product with listing type 'Pre-Order' to get started."
2. **Stage regression:** Admin clicks a stage earlier than current (e.g., going from "Customs" back to "Transit"). Allow it with a warning in the confirmation modal: "This will move the campaign backward. Customer statuses will be updated."
3. **Concurrent stage updates:** Convex transactions handle this. If two admins click different stages simultaneously, last-write-wins. The live query will immediately reflect the latest state for both.
4. **Products without `allocatedStock`:** Display as "∞" (unlimited) or prompt the admin to set an allocation.
5. **Balance button state:** Disable "Request Pending Balances" if already sent (`balanceRequestsSent === true`). Show "Balances Requested ✓" instead. Allow a "Resend" option as secondary action.
6. **Sold out indicator:** When `unitsSold >= allocatedStock`, show a red "SOLD OUT" badge on the card. Optionally show waitlist count if > 0.

---

## Completion Criteria

- [ ] `/admin/campaigns` route exists and is navigable from the dashboard.
- [ ] `getCampaigns` query returns product-centric campaign data with aggregated pre-order stats.
- [ ] Each active pre-order product renders as a `CampaignCard`.
- [ ] `ProcurementStepper` visually shows the current stage with correct color coding.
- [ ] Clicking a stepper step triggers `updateCampaignStage` with a confirmation modal.
- [ ] Stock summary shows "X / Y sold" with a progress indicator.
- [ ] Financial summary shows pending balance to collect.
- [ ] "Request Pending Balances" button is wired (disabled/placeholder until Phase 4).
- [ ] "View Customers" expands to show a compact pre-order list.
- [ ] All states (loading, empty, sold out, no allocation) handled gracefully.
