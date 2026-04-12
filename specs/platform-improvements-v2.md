# Platform Improvements V2 - Technical Specification

> **Date:** 2026-04-12
> **Scope:** 11 features across checkout, admin, email, product schema, UX, and analytics

---

## Table of Contents

1. [Checkout Timer (5-min Stock Reservation)](#1-checkout-timer)
2. [Resend Email Rework](#2-resend-email-rework)
3. [Update Business Number](#3-update-business-number)
4. [SKU Optional](#4-sku-optional)
5. [Material → Type Field](#5-material-to-type-field)
6. [Multi-Picture Gallery](#6-multi-picture-gallery)
7. [PO Shipping Logic Fix](#7-po-shipping-logic-fix)
8. [Order Status Flow Overhaul](#8-order-status-flow-overhaul)
9. [Orders vs Pre-Orders Differentiation](#9-orders-vs-pre-orders-differentiation)
10. [Pre-Order Updates on Admin Approval](#10-pre-order-updates-on-admin-approval)
11. [PO Arrival → Balance Payment Flow](#11-po-arrival-balance-payment-flow)

---

## 1. Checkout Timer

### Requirements
- When user enters checkout page (`/checkout`), reserve stock for 5 minutes
- Visible countdown timer on the checkout page
- On expiry: release stock, redirect to `/cart` with toast message "Your reservation has expired. Items have been returned to stock."
- Applies to **in-stock items only** (not pre-orders)

### Architecture

#### Schema Changes (`convex/schema.ts`)
Add a `stockReservations` table:
```
stockReservations: defineTable({
  userId: v.string(),
  productId: v.id("products"),
  quantity: v.number(),
  expiresAt: v.number(), // timestamp ms
  sessionId: v.string(), // to prevent duplicate reservations
}).index("by_userId", ["userId"])
  .index("by_productId", ["productId"])
  .index("by_expiresAt", ["expiresAt"])
```

#### Backend (`convex/stockReservations.ts`) — New File
- **`reserveStock` mutation**: For each cart item (in-stock only), create reservation + decrement `stockQuantity`. If stock insufficient, reject with error. Returns `expiresAt` timestamp.
- **`releaseStock` mutation**: Delete reservations for user/session, increment `stockQuantity` back.
- **`releaseExpired` action**: Scheduled via `ctx.scheduler.runAfter(300000, ...)` at reservation time. Checks if reservation still exists → releases if so.
- **`consumeReservation` mutation**: Called on successful order creation — deletes reservation without restoring stock (stock already decremented).

#### Frontend (`app/checkout/page.tsx`)
- On mount: call `reserveStock` mutation, store `expiresAt` in state
- Render countdown timer component (mm:ss) using `expiresAt - Date.now()`
- On timer hit 0: call `releaseStock`, redirect to `/cart` with query param `?expired=true`
- On `beforeunload` / route change away from checkout: call `releaseStock`
- On successful order submission: call `consumeReservation` instead

#### Cart Page (`app/cart/page.tsx`)
- Check for `?expired=true` query param, show toast notification

#### Edge Cases
- User opens multiple tabs: `sessionId` (generated per checkout visit) prevents conflicts — each session has its own reservation
- User refreshes checkout page: check for existing reservation by userId before creating new one
- Server crash / scheduler fails: add a periodic cleanup cron (every 10 min) that releases all reservations past `expiresAt`
- Race condition on last item: `reserveStock` must atomically check `stockQuantity >= requestedQty` before decrementing

### Files to Modify
| File | Change |
|------|--------|
| `convex/schema.ts` | Add `stockReservations` table |
| `convex/stockReservations.ts` | **New** — reserve/release/consume/cleanup mutations |
| `app/checkout/page.tsx` | Add timer UI, reservation lifecycle |
| `app/cart/page.tsx` | Handle `?expired=true` toast |
| `convex/orders.ts` | Call `consumeReservation` on order creation |
| `convex/crons.ts` | **New** — periodic cleanup of expired reservations |

---

## 2. Resend Email Rework

### Requirements
- **Remove**: Admin notification email on order placement (`notifyAdminsNewOrder`)
- **Remove**: Admin notification email on balance payment (`notifyAdminsBalancePayment`)
- **Add**: Send `order-confirmation` Resend template to user when admin **verifies payment** (not on order creation)
- **Add**: Send `pre-order-confirmation` Resend template to user when admin **verifies PO deposit**
- **Add**: Send `pre-order-arrival-1` Resend template to user when admin triggers arrival notification
- All templates are pre-built in Resend dashboard — use `resend.emails.send()` with template IDs, not inline HTML

### Template Variable Mapping

#### `order-confirmation` (sent on payment verification)
```json
{
  "customer_name": "user.name or shippingDetails.name",
  "order_id": "order._id",
  "product_list": "comma-separated item names with qty",
  "amount": "order.totalAmount",
  "whatsapp_link": "https://wa.me/919148724708"
}
```

#### `pre-order-confirmation` (sent on deposit verification)
```json
{
  "customer_name": "preOrder.customerName or user.name",
  "product_name": "preOrder.productName"
}
```

#### `pre-order-arrival-1` (sent when admin notifies arrival)
```json
{
  "customer_name": "preOrder.customerName",
  "product_name": "preOrder.productName",
  "amount": "balanceAmount + shipping (100)",
  "link": "https://dreamdiecast.in/garage/pre-orders (user dashboard, requires login)",
  "whatsapp_link": "https://wa.me/919148724708"
}
```

### Architecture

#### Backend (`convex/emails.ts`) — Rewrite
- **Remove** `notifyAdminsNewOrder` and `notifyAdminsBalancePayment`
- **Add** `sendOrderConfirmation(orderId)` — internal action, uses Resend template `order-confirmation`
- **Add** `sendPreOrderConfirmation(preOrderId)` — internal action, uses Resend template `pre-order-confirmation`
- **Add** `sendPreOrderArrival(preOrderId)` — internal action, uses Resend template `pre-order-arrival-1`
- All use `resend.emails.send({ from: "orders@dreamdiecast.in", to: userEmail, subject: "...", react: undefined, template_id: "...", data: {...} })` — or the Resend batch template API depending on how templates are set up (check if Resend supports template IDs via API or if you need to use `resend.emails.send` with the template name)

**Note:** Resend templates can be sent via: `resend.emails.send({ from, to, subject, template_id: "<template-id>", data: { ...variables } })`. Get the template IDs from the Resend dashboard.

#### Trigger Points
| Event | Where | Email Sent |
|-------|-------|------------|
| Admin verifies order payment | `convex/orders.ts` → `updateStatus` mutation (when `paymentStatus` → `verified`) | `sendOrderConfirmation` |
| Admin verifies PO deposit | `convex/preOrders.ts` → status update to `deposit_verified` | `sendPreOrderConfirmation` |
| Admin clicks "Send Arrival Notification" | `convex/preOrders.ts` → new `sendArrivalNotification` mutation | `sendPreOrderArrival` |

#### Remove Email Triggers
- `convex/orders.ts` → `insertOrder`: Remove `ctx.scheduler.runAfter(0, internal.emails.notifyAdminsNewOrder, ...)`
- `convex/preOrders.ts` → `insertBalancePayment` (or wherever balance submission triggers email): Remove admin notification scheduler

### Files to Modify
| File | Change |
|------|--------|
| `convex/emails.ts` | Full rewrite — remove admin emails, add 3 user-facing template sends |
| `convex/orders.ts` | Remove admin email on order creation; add user email on payment verification |
| `convex/preOrders.ts` | Remove admin email on balance submission; add user email on deposit verify; add arrival notification action |

---

## 3. Update Business Number

### Requirements
Replace all occurrences of `919876543210` with `919148724708` (i.e., +91 9148724708)

### Files to Modify
| File | Line Reference | Change |
|------|---------------|--------|
| `app/order-success/page.tsx` | ~Line 65-66 | Update wa.me link |
| `app/page.tsx` | ~Line 43 | Update wa.me link |
| `components/Footer.tsx` | ~Line 20 | Update wa.me link |
| `app/admin/page.tsx` | ~Line 140 | Update wa.me link |
| `components/admin/PreOrderTable.tsx` | ~Line 104, 106 | Update wa.me link |
| `lib/constants.ts` | If any phone constant exists | Update value |

**Also update** the `whatsapp_link` variable in all Resend email template sends (handled in feature #2).

---

## 4. SKU Optional

### Requirements
Make SKU field optional in product schema and admin form.

### Schema Change (`convex/schema.ts`)
Change `sku: v.string()` → `sku: v.optional(v.string())`

(Note: Based on exploration, SKU is already sent as `sku: form.sku || undefined` in the form submission at `ProductForm.tsx:180`, so the form already handles it. Just need to update the schema validator.)

### Files to Modify
| File | Change |
|------|--------|
| `convex/schema.ts` | Make `sku` optional in products table |
| `components/admin/ProductForm.tsx` | Remove any "required" validation on SKU input if present |

---

## 5. Material → Type Field

### Requirements
Replace `material` field (values: "Diecast Metal", "Resin") with `type` field (values: "Box", "Blister", "Acrylic Case").

### Schema Change (`convex/schema.ts`)
- Remove `material: v.optional(v.string())` from products
- Add `type: v.optional(v.string())` to products
- Also update `details.material` if it references the same concept

### Constants Change (`lib/constants.ts`)
- Remove `MATERIAL_OPTIONS = ["Diecast Metal", "Resin"]` (or whatever the current constant is)
- Add `TYPE_OPTIONS = ["Box", "Blister", "Acrylic Case"]`

### Frontend Updates
- **ProductForm.tsx**: Replace material dropdown with type dropdown using `TYPE_OPTIONS`
- **ProductDetailModal.tsx**: Display "Type" instead of "Material" in product specs
- **Any product card/listing** that shows material: update label + field reference

### Data Migration
Existing products with `material` values won't have `type`. Options:
- **Option A** (recommended): Write a one-time Convex migration that maps old material values to null/empty type (since Box/Blister/Acrylic Case is a different concept than Diecast Metal/Resin, no automatic mapping makes sense)
- **Option B**: Leave `material` in schema as deprecated, read `type` with fallback — more messy

### Files to Modify
| File | Change |
|------|--------|
| `convex/schema.ts` | Replace `material` with `type` in products table |
| `lib/constants.ts` | Replace `MATERIAL_OPTIONS` with `TYPE_OPTIONS` |
| `components/admin/ProductForm.tsx` | Update form field, label, dropdown options |
| `components/ProductDetailModal.tsx` | Update display label and field |
| Any product listing components | Update field reference |

---

## 6. Multi-Picture Gallery

### Requirements
- Admin can upload/manage multiple images per product
- Product detail page shows image gallery/carousel
- SEO-optimized: use `next/image` with alt text, structured data

### Architecture

#### Image Storage
Use **Convex file storage** (same as payment proofs) for uploaded images. Store as array of storage IDs + URLs in `images[]` field (already exists in schema).

#### Admin Product Form (`components/admin/ProductForm.tsx`)
- Add multi-file upload input (accept images)
- Show thumbnail previews of uploaded images with drag-to-reorder and delete
- On upload: resize client-side (max 1200x1200, JPEG quality 0.85 for product images), upload to Convex storage via `/upload` HTTP endpoint
- Store returned URLs in `images[]` array
- First image = cover image (used in cards/listings)

#### Product Detail — Gallery Component (`components/ProductImageGallery.tsx`) — New File
- Carousel with thumbnail strip below
- Main image area with `next/image` (priority loading for first image, lazy for rest)
- Thumbnail click to switch
- Swipe support on mobile (use CSS scroll-snap or lightweight carousel)
- Lightbox on click (full-screen overlay with zoom)
- Proper `alt` tags: `"{product.name} - Image {index}"` for accessibility/SEO

#### SEO
- Use `next/image` with explicit `width`/`height` or `fill` + `sizes` attribute
- Add structured data (JSON-LD) for product with `image` array in product detail page
- `loading="eager"` for first image, `loading="lazy"` for rest

### Files to Modify/Create
| File | Change |
|------|--------|
| `components/admin/ProductForm.tsx` | Multi-image upload UI with reorder/delete |
| `components/ProductImageGallery.tsx` | **New** — carousel/gallery component |
| `components/ProductDetailModal.tsx` | Replace single image with `ProductImageGallery` |
| `convex/http.ts` | Verify upload endpoint handles multiple files (likely already fine since it's per-file) |

---

## 7. PO Shipping Logic Fix

### Requirements
- Pre-order **deposit** checkout: **No shipping charge** (already the case, but enforce consistently)
- Pre-order **balance payment**: **Include ₹100 shipping** in the balance amount
- Balance = `totalFinalPrice - depositPaid + FLAT_SHIPPING_RATE`
- This must be reflected in:
  - Admin view (show balance breakdown with shipping)
  - User's "My Pre-Orders" page (show balance breakdown with shipping)
  - The `pre-order-arrival-1` email template `{{amount}}` variable
  - The balance payment page

### Current State
The `/pay/{preOrderId}` page and backend already calculate balance. Need to verify shipping is included and displayed explicitly.

### Changes

#### Backend (`convex/preOrders.ts`)
- In `getForPaymentInternal` / balance calculation: ensure `balanceAmount = totalPrice - depositPaid + 100` (shipping)
- Store `shippingCharges: 100` on the pre-order when balance is calculated

#### Frontend — User Pre-Orders (`app/garage/pre-orders/page.tsx`)
- When status is `stock_arrived` or later, show breakdown:
  - Total Price: ₹X
  - Deposit Paid: -₹Y
  - Shipping: +₹100
  - **Balance Due: ₹Z**

#### Frontend — Admin Pre-Orders (`components/admin/PreOrderTable.tsx`)
- Show same breakdown in admin view for arrived/balance stages

#### Checkout Details (`app/checkout/details/page.tsx`)
- For PO deposit: explicitly show "Shipping: FREE (collected with final payment)" — already has `PO_SHIPPING_NOTE` constant, ensure it's displayed

### Files to Modify
| File | Change |
|------|--------|
| `convex/preOrders.ts` | Ensure balance calculation includes ₹100 shipping |
| `app/garage/pre-orders/page.tsx` | Show balance breakdown with shipping line item |
| `components/admin/PreOrderTable.tsx` | Show balance breakdown with shipping in admin view |
| `app/checkout/details/page.tsx` | Ensure PO deposit shows FREE shipping note |

---

## 8. Order Status Flow Overhaul

### Requirements
New order lifecycle: `pending` → `verified` → `shipped` → `completed`

| Status | Trigger | User Sees | Admin Sees | Color |
|--------|---------|-----------|------------|-------|
| `pending` | Order created | "Payment Under Review" | "Verify Payment" button | Yellow |
| `verified` | Admin verifies payment | "Order Confirmed" | "Mark as Shipped" button | Blue |
| `shipped` | Admin marks shipped | "Shipped" | "Mark as Completed" button | Orange |
| `completed` | Admin marks completed | "Delivered" (green) | "Completed" | Green |

On `completed`: automatically create garage item with `status: 'owned'` for each item in the order.

### Schema Changes (`convex/schema.ts`)
Update `orderStatus` union:
```
orderStatus: v.optional(v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("shipped"),
  v.literal("completed"),
  v.literal("cancelled")
))
```
Remove `processing` from the union (or keep for backward compat with existing orders — migration needed).

### Backend (`convex/orders.ts`)
- **`verifyPayment` mutation**: Sets `paymentStatus: 'verified'`, `orderStatus: 'verified'`. Decrements product stock. Triggers `sendOrderConfirmation` email (feature #2).
- **`markShipped` mutation**: Sets `orderStatus: 'shipped'`. Only allowed when `orderStatus === 'verified'`.
- **`markCompleted` mutation**: Sets `orderStatus: 'completed'`. Only allowed when `orderStatus === 'shipped'`. Creates garage items for each order item with `status: 'owned'`.

### Admin Orders Page (`app/admin/orders/page.tsx`)
- Show contextual action button based on `orderStatus`:
  - `pending`: "Verify Payment" (with payment proof viewer)
  - `verified`: "Mark as Shipped"
  - `shipped`: "Mark as Completed"
  - `completed`: No action (green badge)
- Smooth transition animations on status change

### Admin Fulfillment Page (`app/admin/fulfillment/page.tsx`)
- Show `verified` orders (ready to ship) and `shipped` orders (ready to complete)
- Clear visual separation between the two groups

### User Orders Page (`app/garage/page.tsx`)
- Show status badges with colors per table above
- When order is `completed`, item appears in "Owned" tab of garage
- Smooth UX: status badge with icon + color coding

### Data Migration
Existing orders with `orderStatus: 'processing'` → map to `'verified'`

### Files to Modify
| File | Change |
|------|--------|
| `convex/schema.ts` | Update `orderStatus` union values |
| `convex/orders.ts` | Add `verifyPayment`, `markShipped`, `markCompleted` mutations; update stock logic |
| `convex/garage.ts` or equivalent | Auto-create garage item on order completion |
| `app/admin/orders/page.tsx` | Contextual action buttons per status |
| `app/admin/fulfillment/page.tsx` | Show verified + shipped orders with actions |
| `app/garage/page.tsx` | Updated status badges + owned flow |
| `lib/constants.ts` | Add `ORDER_STATUS_DISPLAY` config (labels, colors) |

---

## 9. Orders vs Pre-Orders Differentiation

### Requirements
- **Admin side** (`/admin/orders`): Add filter toggle — "All" | "Orders" | "Pre-Orders"
- **User side** (`/garage`): Add filter toggle — "All" | "Orders" | "Pre-Orders"
- Both order types remain in the **same list**, but are visually tagged and filterable

### Implementation

#### Identifying Order Type
Orders with `items[].category === 'Pre-Order'` or that have a linked pre-order are POs. Add a computed/stored `orderType: 'order' | 'pre-order'` field or derive from items at query time.

**Recommended**: Add `orderType: v.optional(v.union(v.literal("order"), v.literal("pre-order")))` to orders schema + set on creation. Backfill existing orders.

#### Admin Orders Page (`app/admin/orders/page.tsx`)
- Add filter bar at top: `All | Orders | Pre-Orders` (pill/tab buttons)
- Each order row gets a subtle badge: `ORDER` (blue) or `PRE-ORDER` (purple)
- Filter state stored in URL query param for shareability

#### User Garage/Orders
- Same filter approach on the user's orders view
- Badge styling matches admin

### Files to Modify
| File | Change |
|------|--------|
| `convex/schema.ts` | Add `orderType` to orders table |
| `convex/orders.ts` | Set `orderType` on order creation |
| `app/admin/orders/page.tsx` | Add filter UI + badge per row |
| `app/garage/page.tsx` | Add filter UI + badge per row |

---

## 10. Pre-Order Updates on Admin Approval

### Requirements
When admin verifies a PO deposit payment:
- Pre-order status updates to `deposit_verified`
- User's "My Pre-Orders" page reflects this immediately (Convex reactivity handles this automatically)
- Send `pre-order-confirmation` email to user (covered in feature #2)

### Current State Check
The Convex mutation that verifies deposit already updates status. The user page uses `useQuery` which is reactive. This should **already work** — verify and fix if broken.

### Potential Issues to Investigate
- Is the query on the user side filtering correctly? Does it pick up `deposit_verified` status?
- Is the garage `pre-orders` page using the correct query that includes all relevant statuses?

### Files to Verify/Fix
| File | Change |
|------|--------|
| `app/garage/pre-orders/page.tsx` | Verify reactive query shows updated status |
| `convex/preOrders.ts` | Verify deposit verification mutation works correctly |
| `components/PreOrderTimeline.tsx` | Verify timeline reflects `deposit_verified` |

---

## 11. PO Arrival → Balance Payment Flow

### Requirements (Full Flow)

```
1. Product arrives in stock
2. Admin clicks "Send Arrival Notification" on the pre-order in admin panel
3. Pre-order status → `stock_arrived`
4. Resend `pre-order-arrival-1` template sent to user's email
   - Link points to: https://dreamdiecast.in/garage/pre-orders (requires login)
   - Amount = balance + ₹100 shipping
5. User logs in → "My Pre-Orders" page
6. User sees their PO with status "Stock Arrived — Pay Balance"
7. Balance breakdown shown: Total - Deposit + Shipping = Amount Due
8. User clicks "Pay Balance" → enters checkout flow:
   - Enter/confirm shipping address
   - Upload UPI payment proof + transaction ID
   - Submit
9. Pre-order status → `balance_submitted`
10. Admin sees balance payment proof in admin panel
11. Admin verifies → status → `balance_verified`
12. Admin ships → `shipped` → `delivered`/`completed`
13. Auto-added to garage as "owned"
```

### Admin Panel Changes

#### PreOrderTable (`components/admin/PreOrderTable.tsx`)
- When status is `deposit_verified` or `waiting_for_stock` and product is marked as arrived:
  - Show "Send Arrival Email" button
  - On click: call `sendArrivalNotification` mutation → updates status to `stock_arrived` + sends email
- When status is `balance_submitted`:
  - Show balance payment proof image
  - Show "Verify Balance" / "Reject Balance" buttons

### User Pre-Orders Page (`app/garage/pre-orders/page.tsx`)
- For `stock_arrived` status:
  - Show prominent "Pay Balance" CTA button
  - Show balance breakdown (total - deposit + shipping)
  - Button navigates to balance payment flow (inline or separate page)
- For `balance_submitted`:
  - Show "Balance Under Review" status
- For `balance_verified`:
  - Show "Ready to Ship" status

### Backend (`convex/preOrders.ts`)
- **`sendArrivalNotification` mutation/action**:
  - Updates status to `stock_arrived`
  - Calculates balance: `totalPrice - depositPaid + 100`
  - Stores calculated balance on the pre-order record
  - Schedules `sendPreOrderArrival` email action
- **`submitBalancePayment` action** (already exists): Verify it correctly handles shipping in balance
- **`verifyBalancePayment` mutation**: Updates status to `balance_verified`

### Files to Modify
| File | Change |
|------|--------|
| `convex/preOrders.ts` | Add `sendArrivalNotification` mutation; update balance calc |
| `convex/emails.ts` | Add `sendPreOrderArrival` action (feature #2) |
| `components/admin/PreOrderTable.tsx` | "Send Arrival Email" button; balance verification UI |
| `app/garage/pre-orders/page.tsx` | "Pay Balance" CTA; balance breakdown display |

---

## Global: Files Summary

### New Files
| File | Purpose |
|------|---------|
| `convex/stockReservations.ts` | Stock reservation mutations for checkout timer |
| `convex/crons.ts` | Periodic cleanup of expired reservations |
| `components/ProductImageGallery.tsx` | Image carousel/gallery for product detail |

### Major Modifications
| File | Features |
|------|----------|
| `convex/schema.ts` | #1 reservations table, #4 SKU optional, #5 type field, #8 order status, #9 orderType |
| `convex/emails.ts` | #2 full rewrite |
| `convex/orders.ts` | #1 consume reservation, #2 email triggers, #8 status mutations |
| `convex/preOrders.ts` | #2 email triggers, #7 shipping in balance, #11 arrival notification |
| `app/checkout/page.tsx` | #1 timer + reservation |
| `app/admin/orders/page.tsx` | #8 status actions, #9 type filter |
| `app/garage/page.tsx` | #8 status display, #9 type filter |
| `app/garage/pre-orders/page.tsx` | #7 balance breakdown, #10 verify reactivity, #11 pay balance CTA |
| `components/admin/ProductForm.tsx` | #4 SKU optional, #5 type dropdown, #6 multi-image upload |
| `components/admin/PreOrderTable.tsx` | #3 phone number, #7 balance breakdown, #11 arrival email button |
| `components/ProductDetailModal.tsx` | #5 type display, #6 gallery |
| `lib/constants.ts` | #3 phone number, #5 type options, #8 order status display |

### Minor Modifications (phone number update #3)
- `app/order-success/page.tsx`
- `app/page.tsx`
- `components/Footer.tsx`
- `app/admin/page.tsx`

---

## Completion Criteria

- [ ] Checkout timer counts down from 5:00, stock is reserved, user kicked to cart on expiry
- [ ] No admin email on order/balance placement
- [ ] User receives `order-confirmation` template on admin payment verification
- [ ] User receives `pre-order-confirmation` template on admin deposit verification
- [ ] User receives `pre-order-arrival-1` template when admin sends arrival notification
- [ ] All WhatsApp links use +91 9148724708
- [ ] SKU is optional in product creation
- [ ] "Material" replaced with "Type" (Box/Blister/Acrylic Case) everywhere
- [ ] Admin can upload multiple images; product detail shows carousel
- [ ] PO deposit checkout shows no shipping; PO balance includes ₹100 shipping
- [ ] Order flow: pending → verified → shipped → completed with correct badges/actions
- [ ] Completed orders auto-create garage items as "owned"
- [ ] Admin orders page has "All | Orders | Pre-Orders" filter
- [ ] User orders page has same filter
- [ ] User's "My Pre-Orders" updates reactively on admin actions
- [ ] PO arrival email links to `/garage/pre-orders`; user can pay balance from there
- [ ] All status transitions have smooth UX with appropriate colors/labels on both admin and user sides

---

## Suggested Implementation Order

1. **#3** Update business number (quick win, no dependencies)
2. **#4** SKU optional (quick win)
3. **#5** Material → Type (schema + UI)
4. **#8** Order status flow overhaul (foundational — other features depend on this)
5. **#9** Orders vs Pre-Orders differentiation (builds on #8)
6. **#2** Resend email rework (depends on #8 for verification trigger)
7. **#7** PO shipping logic fix (needed before #11)
8. **#11** PO arrival → balance payment flow (depends on #2 and #7)
9. **#10** Pre-order updates on admin approval (verify + fix)
10. **#6** Multi-picture gallery (independent, can be done anytime)
11. **#1** Checkout timer (most complex, independent)
