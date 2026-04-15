# Phase 4: Balance Request Email (Resend Integration)

**Goal:** Add a balance request email flow so the "Request Pending Balances" button on Campaign Cards actually sends personalized payment emails to customers. Remove manual WhatsApp copy patterns from the admin UI.

**Depends on:** Phase 1 (schema), Phase 3 (Campaign Card UI with balance request button).

---

## Current State

- **`convex/emails.ts`** sends 3 email types via Resend:
  - `sendOrderConfirmation` — on order payment verification
  - `sendPreOrderConfirmation` — on deposit verification
  - `sendPreOrderArrival` — when product marked as arrived (includes balance due + payment link)
- Email sender: `orders@dreamdiecast.in`

**Keep all 3 existing email functions unchanged.**

---

## What to Remove

1. **WhatsApp message generation** in `app/admin/page.tsx` — the `handleArrived` flow that builds a WhatsApp community message string and opens WhatsApp. Remove the WhatsApp copy logic; the Procurement Stepper (Phase 3) replaces the "Mark as Arrived" button.
2. **WhatsApp copy patterns** in `PreOrderTable.tsx` — the `handleSendPaymentLink` function that copies a WhatsApp message and opens `wa.me`. Replace with a non-WhatsApp flow (balance request emails handle this now).

---

## New Convex Action

### `sendBalanceRequestEmail` (New Action)

**File:** `convex/emails.ts` (add to existing)

```
sendBalanceRequestEmail({
  productId: Id<"products">
})
```

**Trigger:** Called when admin clicks "Request Pending Balances" button on the Campaign Card (Phase 3).

**Logic:**
1. Fetch the product.
2. Query all pre-orders for this product where:
   - Status is `stock_arrived` or `deposit_verified` (stock has arrived, balance not yet paid)
   - `balancePaymentStatus` is NOT `"verified"`
3. For each pre-order:
   - Calculate `balanceDue = totalPrice - depositPaid + 100` (₹100 shipping)
   - Generate the payment link: `https://dreamdiecast.in/pay/{preOrderId}`
   - Send personalized email with the exact amount and payment link.
4. After all emails sent, update the product: `balanceRequestsSent = true`.
5. Return `{ emailsSent: number, skipped: number, totalBalanceRequested: number }`.

**Important:** Each email is personalized with that customer's specific balance. This is NOT a single blast — it's a batch of individual emails.

---

## Email Template

### Balance Request Email

```
From: DreamDiecast <orders@dreamdiecast.in>
Subject: Pay ₹{balanceDue} to ship your {productName}
Reply-To: diecastrs1@gmail.com

---

Hi {customerName},

Your {productName} has arrived and is ready to ship!

Here's your payment summary:

  Total Price:     ₹{totalPrice}
  Deposit Paid:    ₹{depositPaid}
  Shipping:        ₹100
  ─────────────────────────
  Balance Due:     ₹{balanceDue}

Pay now to get your model shipped:
[Pay ₹{balanceDue} →]  (link: https://dreamdiecast.in/pay/{preOrderId})

This link is unique to your order. Please do not share it.

— DreamDiecast
```

---

## Integration with Phase 3 UI

In `app/admin/campaigns/page.tsx`, wire the balance request button:

```typescript
const handleRequestBalances = async (productId) => {
  const result = await sendBalanceRequestEmail({ productId });
  toast.success(`Sent ${result.emailsSent} balance request emails`);
};
```

---

## Edge Cases

1. **Missing customer email:** Skip pre-orders without `customerEmail` and include them in the return as `skipped`. Show a warning in the UI.
2. **Duplicate sends:** The `balanceRequestsSent` flag on the product prevents accidental re-sends. If admin clicks "Resend", it sends again (the button is already wired for this in CampaignCard).
3. **Payment link security:** `/pay/{preOrderId}` uses a Convex document ID (random string) — not guessable.

---

## Completion Criteria

- [ ] `sendBalanceRequestEmail` action sends personalized balance + payment link emails.
- [ ] Email uses clean, minimal HTML template with proper ₹ formatting.
- [ ] "Request Pending Balances" button triggers balance request emails and sets `balanceRequestsSent` flag.
- [ ] WhatsApp copy logic removed from admin page.
- [ ] Missing email addresses are handled gracefully (skipped + warning).
- [ ] Email send results shown to admin via toast notifications.
- [ ] Existing email functions (`sendOrderConfirmation`, `sendPreOrderConfirmation`, `sendPreOrderArrival`) unchanged.
