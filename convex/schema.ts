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
        material: v.optional(v.string()),
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
    material: v.optional(v.string()),
    specialFeatures: v.optional(v.string()),
    listingType: v.optional(v.string()),
    status: v.optional(v.string()),
    bookingAdvance: v.optional(v.number()),
    totalFinalPrice: v.optional(v.number()),
    eta: v.optional(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_brand", ["brand"]),

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
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
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

  assets: defineTable({
    name: v.string(),
    url: v.string(),
    storageId: v.optional(v.id("_storage")),
    type: v.union(v.literal("image"), v.literal("video")),
  }),
});
