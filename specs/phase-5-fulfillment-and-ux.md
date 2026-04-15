# Phase 5: Fulfillment Board & Advanced UX Features

**Goal:** Replace the fulfillment list view with a drag-and-drop Kanban board, add a global command palette, and implement bulk selection on the Products tab.

**Depends on:** Phase 1 (schema), Phase 2 (dashboard). Independent of Phases 3-4 for the Kanban and UX features.

---

## Current State

- **Fulfillment page** (`/app/admin/fulfillment/page.tsx`): Two sections — "Ready to Ship" (verified/processing) and "Shipped" (shipped status). Each order is a card with customer info, items, shipping address, and action buttons (Mark Shipped / Mark Completed).
- **No command palette.** Admin navigates via direct links and tabs.
- **No bulk selection.** Products are managed one at a time (edit, status toggle, delete).

---

## 5A: Fulfillment Kanban Board

### Route

```
/app/admin/fulfillment/page.tsx    — MODIFY (replace current list with Kanban)
```

### Kanban Columns

| Column | Order Status | Color |
|--------|-------------|-------|
| To Pack | `verified` | blue |
| Label Generated | `processing` | amber |
| In Transit | `shipped` | purple |
| Delivered | `completed` | green |

### New Convex Mutation

**File:** `convex/orders.ts` (modify)

```
updateFulfillmentStatus({
  orderId: Id<"orders">,
  newStatus: "verified" | "processing" | "shipped" | "completed"
})
```

**Logic:**
1. Auth check: admin only.
2. Validate status transition is forward-only (or allow backward with a flag). Allowed transitions:
   - `verified` → `processing`
   - `processing` → `shipped`
   - `shipped` → `completed`
3. Patch the order status.
4. If moving to `completed`, auto-create garage items (reuse existing logic from `markCompleted`).
5. Return success.

**Why a new mutation?** The existing `markShipped` and `markCompleted` mutations have side effects (emails, garage items) baked in. The Kanban drag needs a unified mutation. Refactor the existing mutations to call this shared logic, or create this as the canonical mutation and have the old ones delegate to it.

### New Convex Query

**File:** `convex/orders.ts` (modify)

```
listFulfillmentBoard({ workosUserId: string })
```

**Returns:**

```typescript
{
  toPack: Order[],
  labelGenerated: Order[],
  inTransit: Order[],
  delivered: Order[],
}
```

Groups orders by status. Each order includes: `_id`, `userEmail`, `items` (name + image + quantity), `shippingDetails`, `orderStatus`, `totalAmount`, `_creationTime`.

### Library

**`@dnd-kit/core` + `@dnd-kit/sortable`** — lightweight, accessible, well-maintained drag-and-drop library.

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### UI Components

**File:** `components/admin/FulfillmentBoard.tsx` (new)

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   To Pack    │ Label Gen'd  │  In Transit  │  Delivered   │
│   (3)        │   (1)        │    (5)       │    (12)      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │
│ │ #ORD-241 │ │ │ #ORD-238 │ │ │ #ORD-235 │ │ │ #ORD-230 │ │
│ │ john@... │ │ │ alex@... │ │ │ sam@...  │ │ │ ravi@... │ │
│ │ GT-R x1  │ │ │ Supra x1 │ │ │ AE86 x2  │ │ │ NSX x1   │ │
│ │ ₹2,400   │ │ │ ₹1,800   │ │ │ ₹3,200   │ │ │ ₹2,100   │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘ │
│ ┌──────────┐ │              │ ┌──────────┐ │              │
│ │ #ORD-240 │ │              │ │ #ORD-234 │ │              │
│ │ ...      │ │              │ │ ...      │ │              │
│ └──────────┘ │              │ └──────────┘ │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**`FulfillmentCard` sub-component:**
- Compact card showing: Order ID (truncated), customer email, item summary (first item name + count), total amount.
- Drag handle on the left edge.
- Click to expand: shows full shipping address and all items.
- Visual: rounded card with left border color matching column.

**Drag behavior:**
- Cards can only be dragged to adjacent or forward columns (To Pack → Label Gen'd → In Transit → Delivered).
- On drop: call `updateFulfillmentStatus` mutation.
- Optimistic update: immediately move the card in UI, revert if mutation fails.
- Drop indicator: highlight the target column with a dashed border.

### Pre-Order Fulfillment

Pre-orders that reach `balance_verified` should also appear on the Kanban board. Add a query that includes pre-orders in the appropriate column:
- `balance_verified` → "To Pack" column
- `shipped` → "In Transit" column
- `delivered` → "Delivered" column

Create a unified `updatePreOrderFulfillmentStatus` mutation that mirrors `updateFulfillmentStatus` for pre-orders.

Display pre-order cards with a "PO" badge to distinguish them from regular orders.

---

## 5B: Command Palette (Cmd+K)

### Library

**`cmdk`** — unstyled, composable command palette. ~3KB gzipped.

```bash
npm install cmdk
```

### Implementation

**File:** `components/admin/CommandPalette.tsx` (new)

Global component rendered in the admin layout. Listens for `Cmd+K` (Mac) / `Ctrl+K` (Windows).

**Search sources:**

1. **Orders:** Search by order ID substring, customer email, transaction ID. Query: `convex/orders.ts` → new `searchOrders({ query: string })` query using `.filter()` on email/transactionId fields.
2. **Customers:** Search by email or name across `users` table. Query: `convex/users.ts` → new `searchUsers({ query: string })`.
3. **Products:** Search by name or SKU. Query: `convex/products.ts` → new `searchProducts({ query: string })`.
4. **Quick Actions:** Static list of navigable actions:
   - "Add New Product" → opens ProductForm modal
   - "Go to Campaigns" → navigates to `/admin/campaigns`
   - "Go to Orders" → navigates to `/admin/orders`
   - "Go to Fulfillment" → navigates to `/admin/fulfillment`

**UX:**
- Debounce search input by 200ms.
- Group results by type: "Orders", "Products", "Customers", "Actions".
- Show max 5 results per group.
- Arrow keys to navigate, Enter to select, Esc to close.
- Result format:
  - Orders: `#ORD-{id} — {email} — ₹{amount}`
  - Products: `{name} — {sku} — {brand}`
  - Customers: `{name} — {email}`

**Integration:**

Mount in the admin layout wrapper:

```typescript
// app/admin/layout.tsx
<CommandPalette />
```

### New Convex Queries

**File:** `convex/search.ts` (new)

```typescript
searchOrders({ query: string, workosUserId: string })
  // Search orders by email substring or _id string match

searchProducts({ query: string })
  // Search products by name or sku substring (case-insensitive)

searchUsers({ query: string, workosUserId: string })
  // Search users by email or name substring
```

**Implementation note:** Convex doesn't have built-in full-text search. Use `.filter()` with string comparison for small datasets. For the scale of this app (<1000 orders, <500 products), this is performant. If scale increases, consider Convex's search indexes.

---

## 5C: Bulk Selection on Products Tab

### UI Changes

**File:** `app/admin/page.tsx` (modify Products tab section)

Add a checkbox to each product card/row. When at least one item is selected, show a floating action bar at the bottom of the viewport.

**Floating Action Bar:**

```
┌──────────────────────────────────────────────────────────────┐
│  3 products selected    [Mark Offline]  [Mark Active]  [✕]  │
└──────────────────────────────────────────────────────────────┘
```

- **Position:** Fixed bottom, centered, with slight elevation/shadow.
- **Actions:**
  - "Mark Offline" → sets `status: "unlisted"` for all selected products.
  - "Mark Active" → sets `status: "active"` (or removes `status`) for all selected.
  - "Delete Selected" → with confirmation modal: "Delete {count} products? This cannot be undone."
  - "✕" → clears selection.
- **Select All:** Checkbox in the header row to select/deselect all visible products.

### New Convex Mutation

**File:** `convex/products.ts` (modify)

```
bulkUpdateStatus({
  productIds: Id<"products">[],
  status: "active" | "unlisted",
  workosUserId: string
})
```

**Logic:**
1. Auth check.
2. Loop through `productIds`, patch each with the new status.
3. Return `{ updated: number }`.

```
bulkDelete({
  productIds: Id<"products">[],
  workosUserId: string
})
```

**Logic:**
1. Auth check.
2. For each product, check no active pre-orders exist (prevent deleting products with open orders).
3. Delete each product.
4. Return `{ deleted: number, skipped: number }`.

### State Management

Use React state in the Products tab component:

```typescript
const [selectedIds, setSelectedIds] = useState<Set<Id<"products">>>(new Set());
```

No need for a global state library. Selection resets on tab switch or navigation.

---

## File Structure

```
app/admin/
  fulfillment/
    page.tsx                        — MODIFY (replace list with Kanban board)
  layout.tsx                        — MODIFY (mount CommandPalette)
  page.tsx                          — MODIFY (add bulk selection to Products tab)

components/admin/
  FulfillmentBoard.tsx              — NEW (Kanban board with dnd-kit)
  FulfillmentCard.tsx               — NEW (draggable order card)
  CommandPalette.tsx                 — NEW (Cmd+K palette with cmdk)
  BulkActionBar.tsx                 — NEW (floating action bar for selections)

convex/
  orders.ts                         — MODIFY (add updateFulfillmentStatus, listFulfillmentBoard)
  products.ts                       — MODIFY (add bulkUpdateStatus, bulkDelete)
  search.ts                         — NEW (searchOrders, searchProducts, searchUsers)
```

### Dependencies to Install

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities cmdk
```

---

## Edge Cases & Error Handling

### Kanban
1. **Backward drag:** Prevent dropping a card into a previous column (e.g., "In Transit" → "To Pack"). Show a visual indicator that the drop is not allowed.
2. **Empty columns:** Show a subtle "No orders" placeholder in empty columns.
3. **Large boards:** If "Delivered" has hundreds of items, paginate or limit to last 30 days. Add a "View All" link.
4. **Optimistic revert:** If the mutation fails after an optimistic move, animate the card back to its original column with an error toast.

### Command Palette
5. **No results:** Show "No results for '{query}'" with a suggestion to try a different search term.
6. **Slow queries:** Show a loading spinner after 300ms. Debounce prevents excessive queries.
7. **Keyboard accessibility:** Ensure focus trap inside the palette. Esc closes. Tab moves between groups.

### Bulk Selection
8. **Empty selection actions:** Disable action buttons when `selectedIds.size === 0` (shouldn't happen since the bar is hidden, but guard anyway).
9. **Deleting products with orders:** `bulkDelete` must check for active pre-orders. Return skipped products with reason: "Has 3 active pre-orders."
10. **Selection across pages:** If product list is paginated in the future, selection should only apply to visible items. No cross-page selection for now.

---

## Completion Criteria

### Kanban Board
- [ ] Fulfillment page shows 4-column Kanban board: To Pack, Label Generated, In Transit, Delivered.
- [ ] Cards are draggable between columns (forward only).
- [ ] Drag-and-drop triggers `updateFulfillmentStatus` mutation.
- [ ] Pre-orders with `balance_verified` appear in the board with "PO" badge.
- [ ] Column headers show item count.
- [ ] Empty columns handled gracefully.

### Command Palette
- [ ] `Cmd+K` / `Ctrl+K` opens the palette globally on admin pages.
- [ ] Search finds orders by ID/email, products by name/SKU, customers by email/name.
- [ ] Quick actions navigate to key pages and open modals.
- [ ] Keyboard navigation works (arrows, enter, escape).
- [ ] Results grouped by type with max 5 per group.

### Bulk Selection
- [ ] Checkboxes appear on product cards in the Products tab.
- [ ] Floating action bar appears when items are selected.
- [ ] "Mark Offline" and "Mark Active" batch-update product statuses.
- [ ] "Delete Selected" requires confirmation and checks for active orders.
- [ ] "Select All" checkbox works.
- [ ] Selection clears on tab switch.
