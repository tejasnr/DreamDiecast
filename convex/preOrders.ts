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
    return await ctx.db.query("preOrders").order("desc").collect();
  },
});

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
      status: "pending",
    });
  },
});

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
    await ctx.db.patch(args.preOrderId, { status: "arrived" });

    const garageItem = await ctx.db
      .query("garageItems")
      .withIndex("by_userId", (q) => q.eq("userId", preOrder.userId))
      .filter((q) => q.eq(q.field("productId"), preOrder.productId))
      .first();

    if (garageItem) {
      await ctx.db.patch(garageItem._id, { status: "arrived" });
    }
  },
});
