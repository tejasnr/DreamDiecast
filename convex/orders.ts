import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { decodeBase64DataUrl } from "./_storage";
import { requireAdmin, requireUser } from "./_utils";

export const byUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const listAll = query({
  args: { workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    return await ctx.db.query("orders").order("desc").collect();
  },
});

const orderItemValidator = v.object({
  productId: v.id("products"),
  name: v.string(),
  price: v.number(),
  originalPrice: v.optional(v.number()),
  image: v.string(),
  category: v.string(),
  brand: v.string(),
  scale: v.string(),
  quantity: v.number(),
});

const shippingDetailsValidator = v.object({
  name: v.string(),
  phone: v.string(),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  pincode: v.string(),
});

export const insertOrder = internalMutation({
  args: {
    userId: v.id("users"),
    userEmail: v.string(),
    items: v.array(orderItemValidator),
    subtotal: v.optional(v.number()),
    shippingCharges: v.optional(v.number()),
    totalAmount: v.number(),
    transactionId: v.string(),
    paymentProofUrl: v.string(),
    paymentMethod: v.string(),
    shippingDetails: v.optional(shippingDetailsValidator),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const products = await Promise.all(
      args.items.map((item) => ctx.db.get(item.productId))
    );

    const preOrderFlags = args.items.map((item, index) => {
      if (item.category === "Balance Payment") return false;
      const product = products[index];
      return (
        product?.listingType === "pre-order" ||
        product?.category === "Pre-Order" ||
        product?.isPreorder === true ||
        item.category === "Pre-Order"
      );
    });

    const orderType = preOrderFlags.some(Boolean)
      ? ("pre-order" as const)
      : ("order" as const);

    const orderId = await ctx.db.insert("orders", {
      ...args,
      paymentStatus: "submitted",
      orderStatus: "pending",
      orderType,
    });

    if (preOrderFlags.some(Boolean)) {
      const now = Date.now();
      for (let index = 0; index < args.items.length; index++) {
        if (!preOrderFlags[index]) continue;

        const item = args.items[index];
        const product = products[index];
        const totalPrice =
          product?.totalFinalPrice ??
          product?.price ??
          item.originalPrice ??
          item.price;
        const customerName = user?.name || args.userEmail;
        const quantity = Math.max(1, item.quantity || 1);

        for (let count = 0; count < quantity; count++) {
          await ctx.db.insert("preOrders", {
            userId: args.userId,
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            brand: item.brand,
            scale: item.scale,
            depositAmount: item.price,
            customerName,
            customerEmail: args.userEmail,
            productName: item.name,
            productImage: item.image,
            productSku: product?.sku,
            totalPrice,
            depositPaid: item.price,
            status: "deposit_submitted",
            source: "website",
            createdAt: now,
          });

          await ctx.db.insert("garageItems", {
            userId: args.userId,
            productId: item.productId,
            name: item.name,
            price: item.price,
            originalPrice: totalPrice,
            image: item.image,
            category: item.category,
            brand: item.brand,
            scale: item.scale,
            purchasedAt: now,
            status: "pre-ordered",
          });
        }
      }
    }

    return orderId;
  },
});

export const create = action({
  args: {
    workosUserId: v.optional(v.string()),
    userId: v.id("users"),
    userEmail: v.string(),
    items: v.array(orderItemValidator),
    subtotal: v.optional(v.number()),
    shippingCharges: v.optional(v.number()),
    totalAmount: v.number(),
    transactionId: v.string(),
    paymentProofDataUrl: v.string(),
    paymentMethod: v.string(),
    shippingDetails: v.optional(shippingDetailsValidator),
  },
  handler: async (ctx, args): Promise<string> => {
    if (!args.workosUserId) throw new Error("Unauthorized: please log in");
    await ctx.runQuery(internal._utils.validateUser, { workosUserId: args.workosUserId });

    const { bytes, contentType } = decodeBase64DataUrl(args.paymentProofDataUrl);
    const storageId = await ctx.storage.store(new Blob([bytes], { type: contentType }));
    const paymentProofUrl = await ctx.storage.getUrl(storageId);

    if (!paymentProofUrl) {
      throw new Error("Failed to store payment proof");
    }

    return await ctx.runMutation(internal.orders.insertOrder, {
      userId: args.userId,
      userEmail: args.userEmail,
      items: args.items,
      subtotal: args.subtotal,
      shippingCharges: args.shippingCharges,
      totalAmount: args.totalAmount,
      transactionId: args.transactionId,
      paymentProofUrl,
      paymentMethod: args.paymentMethod,
      shippingDetails: args.shippingDetails,
    });
  },
});

// Admin verifies payment → order status becomes "verified"
export const verifyPayment = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus === "verified") throw new Error("Payment already verified");

    // Note: Stock for in-stock items is already decremented by the checkout
    // reservation system (reserveStock on checkout entry, consumeReservation
    // on order success). No stock decrement needed here.

    await ctx.db.patch(args.orderId, {
      paymentStatus: "verified",
      orderStatus: "verified",
    });

    // Send order confirmation email to user
    try {
      await ctx.scheduler.runAfter(0, internal.emails.sendOrderConfirmation, {
        orderId: args.orderId,
      });
    } catch {
      // Don't fail verification if email scheduling fails
    }
  },
});

// Admin rejects payment → order cancelled
export const rejectPayment = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.patch(args.orderId, {
      paymentStatus: "rejected",
      orderStatus: "cancelled",
    });
  },
});

// Admin marks order as shipped
export const markShipped = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.orderStatus !== "verified" && order.orderStatus !== "processing") {
      throw new Error("Order must be verified before shipping");
    }
    await ctx.db.patch(args.orderId, { orderStatus: "shipped" });
  },
});

// Admin marks order as completed → auto-create garage items
export const markCompleted = mutation({
  args: { workosUserId: v.optional(v.string()), orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.orderStatus !== "shipped") {
      throw new Error("Order must be shipped before completing");
    }

    await ctx.db.patch(args.orderId, { orderStatus: "completed" });

    // Auto-create garage items for each order item
    for (const item of order.items) {
      await ctx.db.insert("garageItems", {
        userId: order.userId,
        productId: item.productId,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        category: item.category,
        brand: item.brand,
        scale: item.scale,
        purchasedAt: Date.now(),
        status: "owned",
      });
    }
  },
});

// Keep old updateStatus for backward compat but route through new flow
export const updateStatus = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    orderId: v.id("orders"),
    paymentStatus: v.union(v.literal("submitted"), v.literal("verified"), v.literal("rejected")),
    orderStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // Note: Stock decrement is handled by the checkout reservation system.
    // No stock adjustment needed here.

    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
      orderStatus: args.orderStatus,
    });
  },
});

export const remove = mutation({
  args: { workosUserId: v.optional(v.string()), orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.delete(args.orderId);
  },
});

export const countPendingVerification = query({
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .filter((q) =>
        q.or(
          q.eq(q.field("paymentStatus"), "submitted"),
          q.eq(q.field("paymentStatus"), "pending")
        )
      )
      .collect();
    return orders.length;
  },
});

export const listForFulfillment = query({
  args: { workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const orders = await ctx.db.query("orders").collect();
    return orders.filter(
      (order) =>
        order.paymentStatus === "verified" &&
        (order.orderStatus === "verified" ||
         order.orderStatus === "processing" ||
         order.orderStatus === "shipped")
    );
  },
});
