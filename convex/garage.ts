import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./_utils";

export const byUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("garageItems")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    workosUserId: v.optional(v.string()),
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
    status: v.union(v.literal("owned"), v.literal("pre-ordered"), v.literal("arrived")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.workosUserId);
    if (user._id !== args.userId) {
      throw new Error("Unauthorized");
    }
    const { workosUserId: _ignore, ...payload } = args;
    return await ctx.db.insert("garageItems", payload);
  },
});

export const updateStatus = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    garageItemId: v.id("garageItems"),
    status: v.union(v.literal("owned"), v.literal("pre-ordered"), v.literal("arrived")),
    price: v.optional(v.number()),
    originalPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.workosUserId);
    const item = await ctx.db.get(args.garageItemId);
    if (!item || item.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.garageItemId, {
      status: args.status,
      price: args.price ?? item.price,
      originalPrice: args.originalPrice ?? item.originalPrice,
    });
  },
});
