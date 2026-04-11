import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api";
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
    const orderId = await ctx.db.insert("orders", {
      ...args,
      paymentStatus: "submitted",
      orderStatus: "pending",
    });

    // Schedule admin email notification (fire-and-forget)
    try {
      await ctx.scheduler.runAfter(0, internal.emails.notifyAdminsNewOrder, {
        orderId: orderId as string,
        customerEmail: args.userEmail,
        totalAmount: args.totalAmount,
        itemCount: args.items.length,
        isPreOrder: args.items.some((i) => i.category === "Pre-Order"),
        items: args.items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });
    } catch {
      // Don't fail order creation if email scheduling fails
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
    // Actions don't have ctx.db, so use runQuery for user validation
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
      (order) => order.paymentStatus === "verified" && order.orderStatus !== "completed"
    );
  },
});
