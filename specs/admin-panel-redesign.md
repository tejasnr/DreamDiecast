# Admin Panel Redesign - Technical Specification

## Overview

Redesign the admin dashboard (`app/admin/page.tsx`) with three major changes:

1. **Redesigned "Add Product" form** with an IN-STOCK / PRE-ORDER toggle, dropdown-heavy fields, and auto-generated product descriptions
2. **Modern image upload UX** with drag-and-drop, multi-image support, asset library picker, and cover image selection
3. **Enhanced Pre-Order tracking** with auto-calculated balances, status management, manual PO entry, and customer notification actions

---

## 1. File Structure

### Files to CREATE

```
components/admin/
  ProductForm.tsx           # New add/edit product form with IN-STOCK / PRE-ORDER toggle
  ImageDropzone.tsx         # Drag-and-drop multi-image uploader with thumbnail grid
  AssetPickerModal.tsx      # Pop-up to browse & select from existing asset library
  PreOrderTable.tsx         # Customer pre-order tracking table with auto-calculations
  AddPreOrderModal.tsx      # Quick "Add PO" popup for manual WhatsApp/Instagram orders
```

### Files to MODIFY

```
app/admin/page.tsx          # Replace inline form with new components, update tabs
convex/schema.ts            # Update products & preOrders table schemas
convex/products.ts          # Update create/update mutations for new fields
convex/preOrders.ts         # Add manual PO creation, status updates, customer info
```

### Files that MAY need updates (front-end product pages)

```
components/ThemeGrid.tsx    # Auto-generate description from structured product data
app/product/[id]/page.tsx   # Render pre-order pricing, ETA, condition, special features
```

---

## 2. Data Model Changes

### 2.1 Products Table (convex/schema.ts)

**Add these fields:**

```typescript
products: defineTable({
  // KEEP (existing)
  name: v.string(),
  price: v.number(),               // For in-stock: sale price. For pre-order: booking advance
  image: v.optional(v.string()),    // Keep for backward compat (cover image)
  images: v.optional(v.array(v.string())),  // Already exists, now actively used
  brand: v.string(),
  scale: v.string(),
  description: v.optional(v.string()),
  stock: v.optional(v.number()),
  category: v.string(),             // Repurposed: "JDM Legends" | "Exotics & Hypercars" | "Motorsport" | "Normal"

  // NEW FIELDS
  sku: v.optional(v.string()),                // e.g., "CM64-RB-02"
  condition: v.optional(v.string()),          // "Mint / Sealed" | "Opened" | "Loose"
  material: v.optional(v.string()),           // Moved from details.material to top-level
  specialFeatures: v.optional(v.string()),    // Free text: "Opening Parts, Full Carbon Body"
  listingType: v.string(),                    // "in-stock" | "pre-order"
  status: v.optional(v.string()),             // "In Stock" | "Pre-Order" | "Coming Soon"

  // PRE-ORDER specific fields
  isPreorder: v.optional(v.boolean()),        // Already exists
  bookingAdvance: v.optional(v.number()),     // Deposit amount (what goes to cart)
  totalFinalPrice: v.optional(v.number()),    // Full price after stock arrives
  eta: v.optional(v.string()),                // "July 2026" or ISO date

  // DEPRECATE (keep in schema for backward compat, stop writing to them)
  rating: v.optional(v.number()),             // No longer used in form
  details: v.optional(v.object({              // Replaced by top-level material + specialFeatures
    material: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
  })),
  preorderDeadline: v.optional(v.string()),
  releaseDate: v.optional(v.string()),
})
```

**Dropdown option constants** (define in a shared constants file `lib/constants.ts`):

```typescript
export const BRANDS = [
  "Hot Wheels", "Mini GT", "Pop Race", "Tarmac Works",
  "Matchbox", "Bburago", "CM Model", "Inno64", "Kaido House"
] as const;

export const SCALES = ["1/64", "1/43", "1/18"] as const;

export const CATEGORIES = [
  "JDM Legends", "Exotics & Hypercars", "Motorsport", "Normal"
] as const;

export const CONDITIONS = [
  "Mint / Sealed", "Opened", "Loose"
] as const;

export const MATERIALS = ["Diecast Metal", "Resin"] as const;

export const LISTING_TYPES = ["in-stock", "pre-order"] as const;
```

### 2.2 PreOrders Table (convex/schema.ts)

**Restructure for full tracking:**

```typescript
preOrders: defineTable({
  // Customer info
  userId: v.optional(v.id("users")),     // Optional: null for manual POs
  customerName: v.string(),               // NEW: "Rahul Sharma"
  customerPhone: v.optional(v.string()),  // NEW: for WhatsApp notifications
  customerEmail: v.optional(v.string()),  // NEW: for email notifications

  // Product info
  productId: v.id("products"),
  productName: v.string(),                // Denormalized for table display
  productSku: v.optional(v.string()),     // e.g., "CM64-RB-02"
  productImage: v.optional(v.string()),

  // Pricing (auto-calculated balance)
  totalPrice: v.number(),                 // Full price of the product
  depositPaid: v.number(),                // Amount paid upfront
  // balanceDue is computed: totalPrice - depositPaid (NOT stored, calculated in queries/UI)

  // Status tracking
  status: v.union(
    v.literal("waiting_for_stock"),       // Yellow - ETA not reached
    v.literal("stock_arrived"),           // Orange - Stock in, awaiting balance
    v.literal("fully_paid_shipped"),      // Green - Done
    v.literal("cancelled")
  ),

  // Metadata
  source: v.optional(v.string()),         // "website" | "whatsapp" | "instagram" | "manual"
  notes: v.optional(v.string()),
  createdAt: v.optional(v.number()),      // Timestamp
})
  .index("by_userId", ["userId"])
  .index("by_status", ["status"])
  .index("by_productId", ["productId"]),
```

---

## 3. Component Architecture

### 3.1 ProductForm.tsx

**Layout:**

```
+--------------------------------------------------+
|  [ IN-STOCK ]  /  [ PRE-ORDER ]    <-- Toggle    |
+--------------------------------------------------+
|                                                    |
|  [=== IMAGE DROPZONE (drag & drop) ===]           |
|  [ Browse Library ]                                |
|  [ thumb1* ] [ thumb2 ] [ thumb3 ] [ thumb4 ]     |
|    * = cover image                                 |
|                                                    |
|  SKU: [________]     Product Name: [_____________] |
|  Brand: [dropdown]   Scale: [dropdown v 1/64]      |
|  Category: [dropdown]  Condition: [dropdown]        |
|  Material: [dropdown]                               |
|                                                    |
|  --- If IN-STOCK ---                               |
|  Price (INR): [________]                           |
|  Stock Quantity: [________]                         |
|                                                    |
|  --- If PRE-ORDER ---                              |
|  Booking Advance (INR): [________]                 |
|  Total Final Price (INR): [________]               |
|  ETA: [date picker / month-year dropdown]          |
|                                                    |
|  Special Features: [________________________________]|
|  Description (optional): [________________________] |
|                                                    |
|  [ Save Product ]  [ Cancel ]                      |
+--------------------------------------------------+
```

**Behavior:**
- Toggle at top switches between IN-STOCK and PRE-ORDER modes
- When PRE-ORDER is selected: `listingType` = "pre-order", `isPreorder` = true, `category` field on the product still works (JDM, Exotics, etc.)
- The `price` field on the product record stores the **booking advance** for pre-orders (this is what goes to the cart)
- `totalFinalPrice` and `eta` are only shown/required when PRE-ORDER is selected
- All dropdowns: Brand, Scale, Category, Condition, Material
- Remove: Rating field, Features (comma-separated) field
- Add: SKU, Condition, Special Features (single text input)

### 3.2 ImageDropzone.tsx

**Props:**
```typescript
interface ImageDropzoneProps {
  images: string[];                    // Array of image URLs
  onImagesChange: (images: string[]) => void;
  onOpenAssetPicker: () => void;
  maxImages?: number;                  // Default: 10
}
```

**Behavior:**
- Large dashed border area: "Drag & Drop images here, click to Upload, or Select from Assets"
- Accepts multiple files at once
- Uploads each file to Convex storage (same `/upload` endpoint as current)
- Shows thumbnail grid below the dropzone
- First image = cover image (marked with a star/badge)
- Each thumbnail has a red X to remove
- Drag to reorder thumbnails (first = cover)
- "Browse Library" button opens AssetPickerModal

### 3.3 AssetPickerModal.tsx

**Props:**
```typescript
interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;  // Multi-select
  selectedUrls?: string[];              // Already selected (shown as checked)
}
```

**Behavior:**
- Reads from `api.assets.list` (existing query, or add one)
- Grid of all uploaded assets with checkboxes
- Multi-select: click to toggle selection
- "Add Selected" button at bottom
- Search/filter by name

### 3.4 PreOrderTable.tsx

**Columns:**

| Customer | Product | Total Price | Deposit Paid | Balance Due | Status | Action |
|----------|---------|-------------|--------------|-------------|--------|--------|

**Behavior:**
- `Balance Due` = `totalPrice - depositPaid` (calculated in component, not stored)
- Status dropdown inline-editable with color coding:
  - `waiting_for_stock` = Yellow badge
  - `stock_arrived` = Orange badge
  - `fully_paid_shipped` = Green badge
- Action column:
  - **[Notify]** button generates a WhatsApp link (`https://wa.me/{phone}?text=...`) or `mailto:` link with pre-filled message: "Hi {name}, your {product} is here! Please pay the remaining balance of {balanceDue} to ship."
  - Status change dropdown to update status

### 3.5 AddPreOrderModal.tsx

**Quick-add form (3 fields only):**

```
+--------------------------------------+
|  ADD MANUAL PRE-ORDER                |
|                                      |
|  Customer Name: [________________]   |
|  Customer Phone: [________________]  |
|  Product: [dropdown of products v]   |
|  Amount Paid: [________________]     |
|                                      |
|  [ Add Pre-Order ]  [ Cancel ]       |
+--------------------------------------+
```

**Behavior:**
- Product dropdown shows all pre-order products
- On selection, auto-fills `totalPrice` from the product's `totalFinalPrice`
- `depositPaid` = Amount Paid input
- `source` = "manual"
- Creates a preOrder record with `userId: null` (manual entry)

---

## 4. Convex Mutation Changes

### 4.1 products.ts - Updated `create` mutation

```typescript
export const create = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    name: v.string(),
    price: v.number(),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    category: v.string(),
    brand: v.string(),
    scale: v.string(),
    description: v.optional(v.string()),
    stock: v.optional(v.number()),
    sku: v.optional(v.string()),
    condition: v.optional(v.string()),
    material: v.optional(v.string()),
    specialFeatures: v.optional(v.string()),
    listingType: v.string(),
    status: v.optional(v.string()),
    isPreorder: v.optional(v.boolean()),
    bookingAdvance: v.optional(v.number()),
    totalFinalPrice: v.optional(v.number()),
    eta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const { workosUserId, ...payload } = args;
    // Set cover image from first image in array
    if (payload.images?.length && !payload.image) {
      payload.image = payload.images[0];
    }
    return await ctx.db.insert("products", payload);
  },
});
```

### 4.2 preOrders.ts - New mutations

```typescript
// Admin creates a manual pre-order (WhatsApp/Instagram customer)
export const createManual = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    productId: v.id("products"),
    depositPaid: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    return await ctx.db.insert("preOrders", {
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      productId: args.productId,
      productName: product.name,
      productSku: product.sku,
      productImage: product.image,
      totalPrice: product.totalFinalPrice ?? product.price,
      depositPaid: args.depositPaid,
      status: "waiting_for_stock",
      source: "manual",
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

// Admin updates pre-order status
export const updateStatus = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    preOrderId: v.id("preOrders"),
    status: v.union(
      v.literal("waiting_for_stock"),
      v.literal("stock_arrived"),
      v.literal("fully_paid_shipped"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.patch(args.preOrderId, { status: args.status });
  },
});
```

### 4.3 Auto-create pre-order on checkout

When a customer checks out a pre-order product via the existing order flow, a preOrder row should be auto-created:

```typescript
// In the order verification or checkout flow:
// When an order contains a pre-order product, insert into preOrders table:
{
  userId: order.userId,
  customerName: order.shippingDetails.name,
  customerPhone: order.shippingDetails.phone,
  customerEmail: order.userEmail,
  productId: item.productId,
  productName: item.name,
  totalPrice: product.totalFinalPrice,
  depositPaid: item.price,  // The booking advance they paid
  status: "waiting_for_stock",
  source: "website",
  createdAt: Date.now(),
}
```

---

## 5. Front-End Auto-Generated Product Description

When displaying a product on the storefront, the description block is **auto-generated** from structured data rather than manually typed. The component should render:

```
// For Pre-Order products:
(Pre-Order) {sku ? `(${sku}) ` : ""}{name}
Rs. {bookingAdvance}.00
"Check the product description for the final pricing and ETA of the chosen models."
[ Add to Cart ]

Price - {totalFinalPrice} shipped
ETA - {eta}
{specialFeatures}

Brand: {brand}
Scale: {scale}
Condition: {condition}

// For In-Stock products:
{name}
Rs. {price}.00
[ Add to Cart ]

{specialFeatures}

Brand: {brand}
Scale: {scale}
Condition: {condition}
Material: {material}
```

If the admin typed anything in the optional `description` field, append it below the auto-generated block.

---

## 6. Migration & Backward Compatibility

### Existing products
- Existing products have no `listingType` field. Default to `"in-stock"` when `listingType` is missing.
- Existing products with `category === "Pre-Order"` should be treated as `listingType: "pre-order"`.
- Existing `details.material` maps to new `material` field.
- Existing `details.features` array maps to `specialFeatures` (join with ", ").
- The `rating` field stays in the schema but is no longer writable from the form.

### Existing pre-orders
- Current preOrders table lacks `customerName`, `totalPrice`, `depositPaid`, etc.
- Add a one-time migration or handle gracefully: for existing records, derive `customerName` from the linked `userId` -> `users` table, set `totalPrice` = product price, `depositPaid` = `price` field on the preOrder.
- New status values differ from old (`pending`/`confirmed`/`arrived`/`cancelled` -> `waiting_for_stock`/`stock_arrived`/`fully_paid_shipped`/`cancelled`). Map `pending`/`confirmed` -> `waiting_for_stock`, `arrived` -> `stock_arrived`.

---

## 7. Edge Cases & Error Handling

1. **No images selected**: Require at least one image before saving. Show validation error.
2. **Pre-order with no advance**: `bookingAdvance` must be > 0 and < `totalFinalPrice`.
3. **Manual PO for non-pre-order product**: The product dropdown in AddPreOrderModal should only list products with `listingType: "pre-order"`.
4. **Balance calculation edge**: If `depositPaid >= totalPrice`, mark status as `fully_paid_shipped` automatically.
5. **WhatsApp notify with no phone**: Disable the Notify button if `customerPhone` is missing. Show tooltip "No phone number".
6. **Large image uploads**: Keep the existing 5MB soft limit. Show error toast for files exceeding limit.
7. **Drag-and-drop reorder**: If the user reorders thumbnails, the first one always becomes the cover image (`image` field).
8. **Edit existing product**: Pre-populate the toggle (IN-STOCK / PRE-ORDER) based on `listingType`. Pre-populate all dropdowns.
9. **Category backward compat**: Old products may have categories like "New Arrival", "Current Stock", "Bundle". The edit form should still display these but encourage migration to new categories.

---

## 8. Completion Criteria

- [ ] Toggle switch between IN-STOCK and PRE-ORDER at top of product form
- [ ] All dropdown fields working: Brand, Scale, Category, Condition, Material
- [ ] Rating and Features fields removed from form
- [ ] SKU, Condition, Special Features fields added
- [ ] Image dropzone supports drag-and-drop, multi-file upload, and thumbnail preview
- [ ] Cover image badge on first thumbnail, red X to remove any thumbnail
- [ ] Asset picker modal browses existing library with multi-select
- [ ] Pre-order form shows Booking Advance, Total Final Price, ETA fields
- [ ] Pre-order customer table shows: Customer, Product, Total, Deposit, Balance Due, Status, Action
- [ ] Balance Due auto-calculated (not stored)
- [ ] Status dropdown with color-coded badges (yellow/orange/green)
- [ ] "Add PO" button opens quick-add modal for manual pre-orders
- [ ] Notify button generates WhatsApp/email link with pre-filled message
- [ ] Convex schema updated with new fields
- [ ] Convex mutations updated for new product fields and manual PO creation
- [ ] Existing products and pre-orders still render correctly (backward compat)
- [ ] Product pages auto-generate description from structured fields
