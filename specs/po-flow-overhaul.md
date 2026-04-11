# Pre-Order Flow Overhaul

## Problem Statement

1. **Shipping ₹100 is charged at PO time** -- it should only be collected during the final/full payment when the product arrives and is ready to ship.
2. **The PO lifecycle is fragmented** -- users place a PO, admin approves, stock arrives, balance payment happens, but the transitions are manual, unclear, and not UX-friendly.
3. **Admin has no streamlined way to send a payment link** when stock arrives -- the WhatsApp button only sends a generic message, not a direct payment link.
4. **No admin email notifications** -- when a user places an order or PO from the website, admins have no idea until they manually check the dashboard.
5. **No notification badge on ORDERS button** -- the FULFILLMENT button has a count badge, but ORDERS doesn't, so admins miss new unverified orders.

---

## Revised PO Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER PLACES PRE-ORDER                                              │
│  ─────────────────────                                              │
│  1. User browses /pre-orders, adds item to cart                     │
│  2. Goes to /checkout/details → enters shipping info                │
│  3. Goes to /checkout → sees product price ONLY (NO shipping)       │
│  4. Pays deposit via UPI (product price, e.g. ₹500)                │
│  5. Order created: paymentStatus="submitted", type="pre-order"      │
│  6. Redirected to /order-success with PO confirmation               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN VERIFIES DEPOSIT                                             │
│  ──────────────────────                                             │
│  1. Admin sees PO in /admin/orders with "Pre-Order" badge           │
│  2. Verifies UPI screenshot + transaction ID                        │
│  3. Marks payment as "verified"                                     │
│  4. Pre-order status auto-set to "waiting_for_stock"                │
│  5. User gets visual confirmation in /garage/pre-orders             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STOCK ARRIVES (Admin Action)                                       │
│  ────────────────────────────                                       │
│  1. Admin clicks "Arrived" on product in /admin                     │
│  2. All POs for that product batch-update to "stock_arrived"        │
│  3. For EACH affected PO, admin sees a "Send Payment Link" button   │
│  4. Button opens WhatsApp with a DIRECT PAYMENT LINK:               │
│     → Links to /pay/{preOrderId} (new page)                         │
│     → Message includes: product name, balance + shipping total       │
│  5. Admin can also bulk-send via "Notify All" button                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  USER PAYS BALANCE + SHIPPING (Final Payment)                       │
│  ────────────────────────────────────────────                       │
│  1. User clicks link → lands on /pay/{preOrderId}                   │
│  2. Page shows:                                                     │
│     - Product image + name                                          │
│     - Deposit already paid: ₹X                                      │
│     - Balance due: ₹Y                                               │
│     - Shipping: ₹100                                                │
│     - TOTAL TO PAY NOW: ₹(Y + 100)                                 │
│  3. User pays via UPI (same QR/ID flow)                             │
│  4. Enters transaction ID + uploads screenshot                      │
│  5. Balance payment recorded, status → "balance_submitted"          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN VERIFIES BALANCE & SHIPS                                     │
│  ──────────────────────────────                                     │
│  1. Admin sees balance payment in /admin/orders (or PO table)       │
│  2. Verifies screenshot + transaction ID                            │
│  3. Marks as "fully_paid" → PO moves to fulfillment queue           │
│  4. Admin ships → marks "shipped"                                   │
│  5. User sees "Shipped" status in /garage/pre-orders                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Changes

### 1. Remove Shipping from PO Checkout

**Files to modify:**
- `app/checkout/details/page.tsx`
- `app/checkout/page.tsx`
- `lib/constants.ts`

**Logic:**
- During checkout, detect if ALL cart items are pre-order (`category === 'Pre-Order'` or `listingType === 'pre-order'` or `isPreorder === true`).
- If yes: set `shippingCharges = 0` and display a note: _"Shipping (₹100) will be collected with your final payment when the product arrives."_
- The current code already has partial logic for this (`isAllPreOrder` check) -- tighten it so shipping is always ₹0 for PO-only carts.
- Store `shippingCharges: 0` on the order record.

**Constants update (`lib/constants.ts`):**
```ts
// Add a message constant
PO_SHIPPING_NOTE = "Shipping (₹100) will be collected with your final payment when the product arrives.";
```

---

### 2. New Page: `/pay/[preOrderId]` -- Balance Payment Page

**New files:**
- `app/pay/[preOrderId]/page.tsx`

**Purpose:** A dedicated, shareable page for paying the remaining balance on a pre-order. This is the link admin sends via WhatsApp.

**Page layout:**
```
┌──────────────────────────────────────┐
│  DreamDiecast Logo                   │
│                                      │
│  ┌──────────┐                        │
│  │ Product  │  Product Name          │
│  │  Image   │  Scale: 1:18           │
│  └──────────┘  Brand: Bburago        │
│                                      │
│  ─── Payment Summary ───             │
│  Product Price:        ₹2,500        │
│  Deposit Paid:        -₹2,500        │
│  Balance Due:          ₹0            │ (if deposit = full price)
│  Shipping:             ₹100          │
│  ──────────────────────              │
│  TOTAL TO PAY:         ₹100          │
│                                      │
│  ─── Pay via UPI ───                 │
│  [QR Code]                           │
│  UPI ID: sujithsaravanan2004@okaxis  │
│                                      │
│  Transaction ID: [____________]      │
│  Screenshot:    [Upload]             │
│                                      │
│  [  Submit Payment  ]                │
│                                      │
│  ─── Your Shipping Address ───       │
│  (Pre-filled from original order)    │
│  Name: John                          │
│  Address: 123 Main St, Chennai       │
│  [Edit Address]                      │
└──────────────────────────────────────┘
```

**Auth:** This page should work for both logged-in users and unauthenticated visitors (since the link is shared via WhatsApp). Use the `preOrderId` as the token. The page should:
- Fetch pre-order details by ID
- Show product info, deposit paid, balance + shipping
- Accept UPI payment (same flow as current checkout)
- On submit, update the pre-order record with balance payment details

**Data model -- new fields on `preOrders` table:**
```ts
// Add to preOrders schema
balanceTransactionId?: string,
balancePaymentProofUrl?: string,    // Convex storage ID
balancePaymentProofStorageId?: string,
balancePaymentStatus?: string,      // 'pending' | 'submitted' | 'verified' | 'rejected'
balanceAmount?: number,             // balance + shipping
balancePaidAt?: number,
shippingAddress?: {                 // copied from original order or editable
  name: string,
  phone: string,
  address: string,
  city: string,
  state: string,
  pincode: string,
},
```

**New Convex functions (`convex/preOrders.ts`):**
```ts
// Fetch pre-order for balance payment page (public, no auth required)
getForPayment(preOrderId: Id<"preOrders">) → preOrder details + product info

// Submit balance payment (public, no auth required)
submitBalancePayment({
  preOrderId,
  transactionId,
  paymentProofStorageId,
  shippingAddress?,  // optional update
}) → updates preOrder with balance payment info, sets balancePaymentStatus="submitted"
```

---

### 3. New Pre-Order Statuses

**File to modify:** `lib/constants.ts`

**Current statuses:**
```ts
["waiting_for_stock", "stock_arrived", "fully_paid_shipped", "cancelled"]
```

**New statuses:**
```ts
PRE_ORDER_STATUSES = [
  "deposit_submitted",      // User paid deposit, awaiting admin verification
  "deposit_verified",       // Admin verified deposit → waiting for stock
  "waiting_for_stock",      // (alias/legacy — same as deposit_verified)
  "stock_arrived",          // Stock in hand, awaiting balance payment
  "balance_submitted",      // User submitted balance payment
  "balance_verified",       // Admin verified balance → ready to ship
  "shipped",                // Product shipped
  "delivered",              // Product delivered (optional)
  "cancelled",              // Cancelled at any stage
];
```

**Status display mapping (for badges/UI):**

| Status | Badge Color | User-Facing Label | Admin Label |
|--------|------------|-------------------|-------------|
| `deposit_submitted` | Yellow | "Deposit Under Review" | "Verify Deposit" |
| `deposit_verified` | Blue | "Confirmed - Waiting for Stock" | "Waiting for Stock" |
| `stock_arrived` | Orange | "Stock Arrived - Pay Balance" | "Send Payment Link" |
| `balance_submitted` | Yellow | "Balance Under Review" | "Verify Balance" |
| `balance_verified` | Green | "Ready to Ship" | "Ship Now" |
| `shipped` | Green | "Shipped" | "Shipped" |
| `cancelled` | Red | "Cancelled" | "Cancelled" |

---

### 4. Admin: "Send Payment Link" Button

**Files to modify:**
- `components/admin/PreOrderTable.tsx`

**When status = `stock_arrived`:** Show a prominent "Send Payment Link" button (green, WhatsApp icon) for each PO row.

**On click:**
1. Generate the payment URL: `https://dreamdiecast.in/pay/{preOrderId}`
2. Compose WhatsApp message:
   ```
   Hi {customerName}! 🚗

   Great news — your *{productName}* has arrived at DreamDiecast!

   Balance Due: ₹{balanceDue}
   Shipping: ₹100
   Total to Pay: ₹{balanceDue + 100}

   Pay here: {paymentUrl}

   Thank you for your patience! 🙏
   ```
3. Open `https://wa.me/{customerPhone}?text={encodedMessage}`
4. Also copy the payment URL to clipboard with a toast notification.

**Bulk action:** When admin clicks "Arrived" on a product (marking it as arrived), after batch-updating PO statuses, show a modal/dialog listing all affected customers with:
- A "Send All" button that opens WhatsApp Web sequentially (or copies all messages)
- Individual "Send" buttons per customer

---

### 5. Admin: Balance Payment Verification

**Files to modify:**
- `app/admin/orders/page.tsx` OR `components/admin/PreOrderTable.tsx`

**New section/tab in admin:** "Balance Payments" -- shows all POs with `balancePaymentStatus === "submitted"`.

Each row shows:
- Customer name + phone
- Product name
- Balance amount paid
- Transaction ID
- Payment screenshot (clickable to expand)
- [Verify] / [Reject] buttons

**On verify:**
- Set `balancePaymentStatus = "verified"`
- Set PO status to `balance_verified`
- PO appears in fulfillment queue

**On reject:**
- Set `balancePaymentStatus = "rejected"`
- PO status stays at `stock_arrived`
- Admin can re-send payment link

---

### 6. User-Facing: Garage Pre-Orders Improvements

**File to modify:** `app/garage/pre-orders/page.tsx`

**Current:** Shows pre-order items with basic status.

**Improved UX -- show a visual timeline/stepper:**

```
┌──────────────────────────────────────────────┐
│  [Product Image]  Product Name               │
│                   ₹2,500                     │
│                                              │
│  ● Deposit Paid ──── ○ Stock Arriving ────   │
│    ○ Pay Balance ──── ○ Shipped              │
│                                              │
│  Status: Confirmed - Waiting for Stock       │
│  Deposit: ₹2,500 ✓                          │
│                                              │
│  [No action needed right now]                │
└──────────────────────────────────────────────┘
```

When status = `stock_arrived`:
```
┌──────────────────────────────────────────────┐
│  [Product Image]  Product Name               │
│                   ₹2,500                     │
│                                              │
│  ● Deposit Paid ──── ● Stock Arrived ────    │
│    ◉ Pay Balance ──── ○ Shipped              │
│                                              │
│  🎉 Your product has arrived!                │
│  Balance: ₹0  +  Shipping: ₹100             │
│  Total to pay: ₹100                          │
│                                              │
│  [ Pay Now → ]  (links to /pay/{preOrderId}) │
└──────────────────────────────────────────────┘
```

---

### 7. Checkout Page: PO-Aware Messaging

**Files to modify:**
- `app/checkout/page.tsx`
- `app/checkout/details/page.tsx`

**On the details page**, when cart is all pre-orders:
- Show shipping address form as normal (address is saved for later)
- Replace shipping line with: _"Shipping: FREE now (₹100 collected at final payment)"_
- Add an info banner at top: _"Pre-Order Deposit -- You're securing your item. Shipping + any balance will be collected when it arrives."_

**On the payment page**, when cart is all pre-orders:
- Order summary shows: Product price only, shipping = ₹0
- Add a footer note: _"This is a deposit payment. You'll pay shipping (₹100) when your item arrives."_
- Change submit button text from "Submit Payment" to "Pay Deposit"

---

### 8. Order Success Page: PO-Specific Messaging

**File to modify:** `app/order-success/page.tsx`

When the completed order is a pre-order:
- Heading: "Pre-Order Confirmed!"
- Body: "Your deposit has been submitted. We'll notify you via WhatsApp when your item arrives."
- Show the PO timeline stepper (Step 1 highlighted)
- WhatsApp button: "Join our WhatsApp community for updates"

---

## Data Model Changes

### `convex/schema.ts` -- preOrders table additions:

```ts
// New fields to add
balanceTransactionId: v.optional(v.string()),
balancePaymentProofStorageId: v.optional(v.id("_storage")),
balancePaymentStatus: v.optional(v.string()),  // 'pending' | 'submitted' | 'verified' | 'rejected'
balanceAmount: v.optional(v.number()),
balancePaidAt: v.optional(v.number()),
shippingCharges: v.optional(v.number()),       // ₹100 -- set at balance payment time
shippingAddress: v.optional(v.object({
  name: v.string(),
  phone: v.string(),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  pincode: v.string(),
})),
```

### `convex/schema.ts` -- orders table:

No structural changes, but orders with `isPreOrder: true` should have `shippingCharges: 0`.

---

## New Files

| File | Purpose |
|------|---------|
| `app/pay/[preOrderId]/page.tsx` | Balance payment page (shareable via WhatsApp) |
| `components/PreOrderTimeline.tsx` | Reusable PO status stepper component |
| `components/BalancePaymentForm.tsx` | UPI payment form for balance (extracted from checkout for reuse) |
| `components/admin/BalancePaymentsTab.tsx` | Admin tab for verifying balance payments |
| `components/admin/SendPaymentLinkModal.tsx` | Modal for bulk-sending WhatsApp payment links |
| `convex/emails.ts` | Email notification actions (Resend) for admin alerts |

---

## 9. Admin Email Notifications on New Orders

**Problem:** Admins currently have no way to know a new order or PO was placed unless they open the dashboard. They need real-time email alerts.

**Approach: Resend (recommended for Convex)**

Resend is the simplest email service to integrate with Convex actions. It has a generous free tier (100 emails/day) and a clean API.

**Setup:**
1. Install: `npm install resend`
2. Add env variable: `RESEND_API_KEY` in Convex dashboard (Settings → Environment Variables)
3. Verify sender domain or use Resend's free `onboarding@resend.dev` for testing

**New files:**
- `convex/emails.ts` -- Convex action that sends emails via Resend

**Implementation (`convex/emails.ts`):**
```ts
import { Resend } from "resend";
import { action } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_NOTIFICATION_EMAILS = [
  "diecastrs1@gmail.com",
  "rakuteninsi1@gmail.com",
  // add/remove as needed
];

export const notifyAdminsNewOrder = action({
  args: {
    orderId: v.string(),
    customerEmail: v.string(),
    totalAmount: v.number(),
    itemCount: v.number(),
    isPreOrder: v.boolean(),
    items: v.array(v.object({
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const orderType = args.isPreOrder ? "Pre-Order" : "Order";
    const itemsList = args.items
      .map((item) => `• ${item.name} × ${item.quantity} — ₹${item.price}`)
      .join("\n");

    await resend.emails.send({
      from: "DreamDiecast <orders@dreamdiecast.in>",  // or onboarding@resend.dev
      to: ADMIN_NOTIFICATION_EMAILS,
      subject: `New ${orderType} — ₹${args.totalAmount} (${args.itemCount} items)`,
      html: `
        <h2>New ${orderType} Received!</h2>
        <p><strong>Customer:</strong> ${args.customerEmail}</p>
        <p><strong>Total:</strong> ₹${args.totalAmount}</p>
        <p><strong>Items:</strong></p>
        <pre>${itemsList}</pre>
        <p><strong>Order ID:</strong> ${args.orderId}</p>
        <br/>
        <p><a href="https://dreamdiecast.in/admin/orders">View in Admin Dashboard →</a></p>
      `,
    });
  },
});
```

**Trigger point -- modify `convex/orders.ts` → `insertOrder` mutation:**

After the order is inserted successfully, schedule the email notification:

```ts
// At the end of insertOrder handler, after ctx.db.insert("orders", ...)
await ctx.scheduler.runAfter(0, api.emails.notifyAdminsNewOrder, {
  orderId,
  customerEmail: args.userEmail,
  totalAmount: args.totalAmount,
  itemCount: args.items.length,
  isPreOrder: args.items.some(i => i.category === "Pre-Order"),
  items: args.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
});
```

**Note:** Use `ctx.scheduler.runAfter(0, ...)` (not `await action`) so the email is fire-and-forget -- the order creation doesn't fail if the email fails.

**What triggers emails:**

| Event | Email Subject | Recipients |
|-------|--------------|------------|
| New order placed | "New Order — ₹X (Y items)" | All admin emails |
| New pre-order placed | "New Pre-Order — ₹X (Y items)" | All admin emails |
| Balance payment submitted | "Balance Payment Submitted — {product}" | All admin emails |

---

## 10. Notification Badge on ORDERS Button

**Problem:** The FULFILLMENT button already has a notification count badge (brown/gold circle with number), but the ORDERS button doesn't. Admins miss new unverified orders.

**File to modify:** `app/admin/page.tsx`

**Current ORDERS button (line ~229):**
```tsx
<Link href="/admin/orders" className="...">
  <ShoppingBag size={20} /> Orders
</Link>
```

**Updated ORDERS button -- add badge like FULFILLMENT has:**
```tsx
<Link
  href="/admin/orders"
  className="border border-white/10 hover:border-accent text-white/60 hover:text-accent px-6 py-4 font-display font-bold uppercase tracking-wider transition-all flex items-center gap-2 relative"
>
  <ShoppingBag size={20} /> Orders
  {pendingOrdersCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-accent text-white text-[8px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
      {pendingOrdersCount}
    </span>
  )}
</Link>
```

**Badge count calculation -- add to admin page:**
```tsx
const pendingOrdersCount = orders?.filter(
  (o) => o.paymentStatus === "submitted"
).length ?? 0;
```

This counts orders where payment has been submitted but not yet verified/rejected -- the ones that need admin attention.

**New Convex query (optional, for efficiency):**

Instead of filtering client-side, add a dedicated count query in `convex/orders.ts`:

```ts
export const countPendingVerification = query({
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("paymentStatus"), "submitted"))
      .collect();
    return orders.length;
  },
});
```

**Visual consistency:** Use the exact same badge styling as FULFILLMENT -- `bg-accent` (brown/gold), `text-[8px]`, `w-5 h-5`, `rounded-full`, `animate-pulse`, positioned at `-top-2 -right-2`.

---

## Edge Cases & Error Handling

1. **User visits `/pay/{id}` for a cancelled PO:** Show "This pre-order has been cancelled" with a link to browse products.
2. **User visits `/pay/{id}` for an already-paid PO:** Show "Payment already received! Your item is being prepared for shipping."
3. **User visits `/pay/{id}` with invalid ID:** Show 404 with link to home.
4. **Admin rejects balance payment:** PO reverts to `stock_arrived`, user can re-pay via the same link.
5. **Partial deposit (manual PO):** Balance = totalPrice - depositPaid. Shipping ₹100 added on top.
6. **Product price changed after PO:** Use the price locked at PO creation time (`totalPrice` field), not current product price.
7. **Multiple POs for same product, same customer:** Each has its own payment link and independent flow.
8. **Legacy POs with old statuses:** Map `waiting_for_stock` → `deposit_verified`, `fully_paid_shipped` → `shipped`. Run a one-time migration or handle in display logic.

---

## Migration Strategy

1. **Backward compatibility:** Keep old status values working. Add a helper that normalizes old statuses to new ones for display.
2. **Existing POs:** Don't migrate data. New fields (`balanceTransactionId`, etc.) are all optional. Old POs continue working with existing flow.
3. **Gradual rollout:** The `/pay/[preOrderId]` page works independently. Admin can start using "Send Payment Link" immediately for new POs.

---

## Completion Criteria

- [ ] PO checkout charges ₹0 shipping, with clear messaging about future shipping charge
- [ ] `/pay/{preOrderId}` page works, shows balance + ₹100 shipping, accepts UPI payment
- [ ] Admin can click "Send Payment Link" on any `stock_arrived` PO → opens WhatsApp with direct link
- [ ] Admin can verify/reject balance payments
- [ ] User's garage shows visual timeline stepper for PO status
- [ ] Order success page shows PO-specific messaging
- [ ] Legacy POs continue to work without migration
- [ ] Balance payment page works without requiring login (accessible via WhatsApp link)
- [ ] Admin emails sent via Resend when a new order/PO is placed and when balance payment is submitted
- [ ] ORDERS button on admin dashboard shows notification badge (same style as FULFILLMENT) with count of unverified payments
