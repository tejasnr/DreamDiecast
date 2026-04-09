import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireUser } from "./_utils";

export const byUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("preOrders")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const listAll = query({
  args: { workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const preOrders = await ctx.db.query("preOrders").order("desc").collect();

    // Normalize old records for display
    return preOrders.map((po) => ({
      ...po,
      customerName: po.customerName || po.name || "Unknown",
      productName: po.productName || po.name || "Unknown Product",
      productImage: po.productImage || po.image,
      totalPrice: po.totalPrice ?? po.price ?? 0,
      depositPaid: po.depositPaid ?? po.depositAmount ?? 0,
      // Map old statuses to new ones for display
      normalizedStatus: mapStatus(po.status),
    }));
  },
});

function mapStatus(status: string): string {
  switch (status) {
    case "pending":
    case "confirmed":
      return "waiting_for_stock";
    case "arrived":
      return "stock_arrived";
    case "waiting_for_stock":
    case "stock_arrived":
    case "fully_paid_shipped":
    case "cancelled":
      return status;
    default:
      return "waiting_for_stock";
  }
}

// Existing create mutation for website checkout
export const create = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    userId: v.id("users"),
    productId: v.id("products"),
    name: v.string(),
    price: v.number(),
    image: v.string(),
    category: v.string(),
    brand: v.string(),
    scale: v.string(),
    depositAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.workosUserId);
    if (user._id !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Get product for enriched data
    const product = await ctx.db.get(args.productId);

    return await ctx.db.insert("preOrders", {
      userId: args.userId,
      productId: args.productId,
      name: args.name,
      price: args.price,
      image: args.image,
      category: args.category,
      brand: args.brand,
      scale: args.scale,
      depositAmount: args.depositAmount,
      // Also write new-format fields
      customerName: (user as any).name || user.email,
      customerEmail: user.email,
      productName: args.name,
      productImage: args.image,
      productSku: product?.sku,
      totalPrice: product?.totalFinalPrice ?? args.price,
      depositPaid: args.depositAmount,
      status: "waiting_for_stock",
      source: "website",
      createdAt: Date.now(),
    });
  },
});

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

    const totalPrice = product.totalFinalPrice ?? product.price;
    const depositPaid = args.depositPaid;

    // Auto-mark as fully paid if deposit covers total
    const status =
      depositPaid >= totalPrice ? "fully_paid_shipped" : "waiting_for_stock";

    return await ctx.db.insert("preOrders", {
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      productId: args.productId,
      productName: product.name,
      productSku: product.sku,
      productImage: product.image,
      totalPrice,
      depositPaid,
      status,
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

// Keep the old markArrived for backward compat
export const markArrived = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    preOrderId: v.id("preOrders"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const preOrder = await ctx.db.get(args.preOrderId);
    if (!preOrder) {
      throw new Error("Pre-order not found");
    }
    await ctx.db.patch(args.preOrderId, { status: "stock_arrived" });

    if (preOrder.userId) {
      const garageItem = await ctx.db
        .query("garageItems")
        .withIndex("by_userId", (q) => q.eq("userId", preOrder.userId!))
        .filter((q) => q.eq(q.field("productId"), preOrder.productId))
        .first();

      if (garageItem) {
        await ctx.db.patch(garageItem._id, { status: "arrived" });
      }
    }
  },
});
