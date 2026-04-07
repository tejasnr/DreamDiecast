import { mutation, query } from "./_generated/server";
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

export const create = mutation({
  args: {
    workosUserId: v.optional(v.string()),
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
    subtotal: v.optional(v.number()),
    shippingCharges: v.optional(v.number()),
    totalAmount: v.number(),
    transactionId: v.string(),
    paymentProofDataUrl: v.string(),
    paymentMethod: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.workosUserId);
    if (user._id !== args.userId) {
      throw new Error("Unauthorized");
    }

    const { bytes, contentType } = decodeBase64DataUrl(args.paymentProofDataUrl);
    const storageId = await ctx.storage.store(new Blob([bytes], { type: contentType }));
    const paymentProofUrl = await ctx.storage.getUrl(storageId);

    if (!paymentProofUrl) {
      throw new Error("Failed to store payment proof");
    }

    return await ctx.db.insert("orders", {
      userId: args.userId,
      userEmail: args.userEmail,
      items: args.items,
      subtotal: args.subtotal,
      shippingCharges: args.shippingCharges,
      totalAmount: args.totalAmount,
      transactionId: args.transactionId,
      paymentProofUrl,
      paymentMethod: args.paymentMethod,
      paymentStatus: "submitted",
      orderStatus: "pending",
      shippingDetails: args.shippingDetails,
    });
  },
});

export const updateStatus = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    orderId: v.id("orders"),
    paymentStatus: v.union(v.literal("submitted"), v.literal("verified"), v.literal("rejected")),
    orderStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (args.paymentStatus === "verified" && order.paymentStatus !== "verified") {
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (product?.stock !== undefined && item.category !== "Pre-Order") {
          await ctx.db.patch(item.productId, {
            stock: Math.max(0, product.stock - item.quantity),
          });
        }
      }
    }

    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
      orderStatus: args.orderStatus,
    });
  },
});

export const markCompleted = mutation({
  args: { workosUserId: v.optional(v.string()), orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.patch(args.orderId, { orderStatus: "completed" });
  },
});

export const remove = mutation({
  args: { workosUserId: v.optional(v.string()), orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.delete(args.orderId);
  },
});

export const listForFulfillment = query({
  args: { workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const orders = await ctx.db.query("orders").collect();
    return orders.filter(
      (order) => order.paymentStatus === "verified" && order.orderStatus !== "completed"
    );
  },
});
