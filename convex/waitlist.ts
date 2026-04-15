import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./_utils";

export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    // Check product is sold out or unlisted
    const isFull =
      product.allocatedStock !== undefined &&
      (product.unitsSold ?? 0) >= product.allocatedStock;
    const isUnlisted = product.status === "unlisted";

    if (!isFull && !isUnlisted) {
      throw new Error("Product is still available for pre-order");
    }

    // Check for duplicate entry
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_productId_email", (q) =>
        q.eq("productId", args.productId).eq("email", args.email)
      )
      .first();

    if (existing) {
      throw new Error("Already on the waitlist for this product");
    }

    return await ctx.db.insert("waitlist", {
      email: args.email,
      productId: args.productId,
      createdAt: Date.now(),
    });
  },
});

export const leaveWaitlist = mutation({
  args: {
    email: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("waitlist")
      .withIndex("by_productId_email", (q) =>
        q.eq("productId", args.productId).eq("email", args.email)
      )
      .first();

    if (entry) {
      await ctx.db.delete(entry._id);
    }
  },
});

export const getWaitlist = query({
  args: {
    workosUserId: v.optional(v.string()),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const entries = await ctx.db
      .query("waitlist")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    return entries.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const getWaitlistCount = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("waitlist")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    return entries.length;
  },
});
