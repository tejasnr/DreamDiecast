import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    price: v.number(),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    category: v.string(),
    brand: v.string(),
    scale: v.string(),
    description: v.optional(v.string()),
    stock: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
    isPreorder: v.optional(v.boolean()),
    preorderDeadline: v.optional(v.string()),
    releaseDate: v.optional(v.string()),
    rating: v.optional(v.number()),
    details: v.optional(
      v.object({
        type: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
      })
    ),
    reviews: v.optional(
      v.array(
        v.object({
          user: v.string(),
          rating: v.number(),
          comment: v.string(),
        })
      )
    ),
    // New fields
    sku: v.optional(v.string()),
    condition: v.optional(v.string()),
    type: v.optional(v.string()),
    material: v.optional(v.string()), // deprecated — replaced by `type`, kept for existing data
    specialFeatures: v.optional(v.string()),
    listingType: v.optional(v.string()),
    status: v.optional(v.string()),
    bookingAdvance: v.optional(v.number()),
    totalFinalPrice: v.optional(v.number()),
    eta: v.optional(v.string()),
    isHype: v.optional(v.boolean()),
    slug: v.optional(v.string()),

    // Campaign fields (relevant when listingType === "pre-order")
    allocatedStock: v.optional(v.number()),
    unitsSold: v.optional(v.number()),
    procurementStage: v.optional(
      v.union(
        v.literal("brand_ordered"),
        v.literal("international_transit"),
        v.literal("customs_processing"),
        v.literal("inventory_ready")
      )
    ),
    totalDepositsCollected: v.optional(v.number()),
    totalLockedBalances: v.optional(v.number()),
    balanceRequestsSent: v.optional(v.boolean()),
  })
    .index("by_category", ["category"])
    .index("by_brand", ["brand"])
    .index("by_listingType", ["listingType"])
    .index("by_slug", ["slug"]),

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    workosUserId: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_workosUserId", ["workosUserId"]),

  orders: defineTable({
    userId: v.id("users"),
    userEmail: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        originalPrice: v.optional(v.number()),
        image: v.string(),
        category: v.string(),
        brand: v.string(),
        scale: v.string(),
        quantity: v.number(),
      })
    ),
    totalAmount: v.number(),
    subtotal: v.optional(v.number()),
    shippingCharges: v.optional(v.number()),
    transactionId: v.string(),
    paymentProofUrl: v.string(),
    paymentMethod: v.string(),
    paymentStatus: v.union(
      v.literal("submitted"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    orderStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("processing"), // backward compat
      v.literal("shipped"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    orderType: v.optional(v.union(v.literal("order"), v.literal("pre-order"))),
    shippingDetails: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        address: v.string(),
        city: v.string(),
        state: v.string(),
        pincode: v.string(),
      })
    ),
    sessionId: v.optional(v.string()),
    couponCode: v.optional(v.string()),
    couponDiscount: v.optional(v.number()),
    couponShippingWaived: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_orderStatus", ["orderStatus"]),

  garageItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    name: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    image: v.string(),
    category: v.string(),
    brand: v.string(),
    scale: v.string(),
    purchasedAt: v.number(),
    status: v.union(
      v.literal("owned"),
      v.literal("pre-ordered"),
      v.literal("arrived")
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"]),

  preOrders: defineTable({
    // Keep old fields for backward compat
    userId: v.optional(v.id("users")),
    productId: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    image: v.optional(v.string()),
    category: v.optional(v.string()),
    brand: v.optional(v.string()),
    scale: v.optional(v.string()),
    depositAmount: v.optional(v.number()),

    // New fields
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    productName: v.optional(v.string()),
    productSku: v.optional(v.string()),
    productImage: v.optional(v.string()),
    totalPrice: v.optional(v.number()),
    depositPaid: v.optional(v.number()),
    status: v.union(
      // Old statuses (backward compat)
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("arrived"),
      // New statuses
      v.literal("waiting_for_stock"),
      v.literal("deposit_submitted"),
      v.literal("deposit_verified"),
      v.literal("stock_arrived"),
      v.literal("balance_submitted"),
      v.literal("balance_verified"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("fully_paid_shipped"),
      v.literal("cancelled")
    ),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.optional(v.number()),

    // Balance payment fields
    balanceTransactionId: v.optional(v.string()),
    balancePaymentProofStorageId: v.optional(v.id("_storage")),
    balancePaymentProofUrl: v.optional(v.string()),
    balancePaymentStatus: v.optional(v.string()),
    balanceAmount: v.optional(v.number()),
    balancePaidAt: v.optional(v.number()),
    shippingCharges: v.optional(v.number()),
    shippingAddress: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        address: v.string(),
        city: v.string(),
        state: v.string(),
        pincode: v.string(),
      })
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_customerEmail", ["customerEmail"])
    .index("by_status", ["status"])
    .index("by_productId", ["productId"]),

  settings: defineTable({
    key: v.string(),
    heroBackground: v.optional(v.string()),
    vaultImage: v.optional(v.string()),
    footerBackground: v.optional(v.string()),
    categoryJdm: v.optional(v.string()),
    categoryEuropean: v.optional(v.string()),
    categoryHypercars: v.optional(v.string()),
    brandHotwheels: v.optional(v.string()),
    brandBburago: v.optional(v.string()),
    brandMinigt: v.optional(v.string()),
    brandPoprace: v.optional(v.string()),
    brandPostercars: v.optional(v.string()),
    brandMatchbox: v.optional(v.string()),
  }).index("by_key", ["key"]),

  stockReservations: defineTable({
    userId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
    expiresAt: v.number(),
    sessionId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_productId", ["productId"])
    .index("by_expiresAt", ["expiresAt"]),

  waitlist: defineTable({
    email: v.string(),
    productId: v.id("products"),
    createdAt: v.number(),
    notified: v.optional(v.boolean()),
  })
    .index("by_productId", ["productId"])
    .index("by_email", ["email"])
    .index("by_productId_email", ["productId", "email"]),

  coupons: defineTable({
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.union(
      v.literal("percentage"),
      v.literal("flat"),
      v.literal("free_shipping")
    ),
    discountValue: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    perUserLimit: v.optional(v.number()),
    timesUsed: v.number(),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    applicableBrands: v.optional(v.array(v.string())),
    applicableCategories: v.optional(v.array(v.string())),
    applicableListingTypes: v.optional(
      v.array(v.union(v.literal("in-stock"), v.literal("pre-order")))
    ),
    isActive: v.boolean(),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"]),

  couponRedemptions: defineTable({
    couponId: v.id("coupons"),
    userId: v.id("users"),
    orderId: v.id("orders"),
    code: v.string(),
    discountApplied: v.number(),
    shippingWaived: v.optional(v.boolean()),
    redeemedAt: v.number(),
  })
    .index("by_couponId", ["couponId"])
    .index("by_userId", ["userId"])
    .index("by_userId_couponId", ["userId", "couponId"]),

  assets: defineTable({
    name: v.string(),
    url: v.string(),
    storageId: v.optional(v.id("_storage")),
    type: v.union(v.literal("image"), v.literal("video")),
  }),
});
