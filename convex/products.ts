import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./_utils";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.map((p) => ({ ...p, id: p._id }));
  },
});

export const create = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    name: v.string(),
    price: v.number(),
    image: v.string(),
    category: v.union(
      v.literal("Pre-Order"),
      v.literal("In Stock"),
      v.literal("New Arrival"),
      v.literal("Bundle"),
      v.literal("Current Stock")
    ),
    brand: v.string(),
    scale: v.string(),
    description: v.optional(v.string()),
    stock: v.optional(v.number()),
    rating: v.optional(v.number()),
    details: v.optional(
      v.object({
        material: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const { workosUserId: _ignore, ...payload } = args;
    return await ctx.db.insert("products", payload);
  },
});

export const update = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    id: v.id("products"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    image: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("Pre-Order"),
        v.literal("In Stock"),
        v.literal("New Arrival"),
        v.literal("Bundle"),
        v.literal("Current Stock")
      )
    ),
    brand: v.optional(v.string()),
    scale: v.optional(v.string()),
    description: v.optional(v.string()),
    stock: v.optional(v.number()),
    rating: v.optional(v.number()),
    details: v.optional(
      v.object({
        material: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const { id, workosUserId: _ignore, ...patch } = args;
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { workosUserId: v.optional(v.string()), id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.delete(args.id);
  },
});

export const getByBrand = query({
  args: { brand: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand", (q) => q.eq("brand", args.brand))
      .collect();
    return products.map((p) => ({ ...p, id: p._id }));
  },
});

export const getCountByBrand = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    }
    return counts;
  },
});

export const markArrived = mutation({
  args: { workosUserId: v.optional(v.string()), id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.patch(args.id, { category: "Current Stock" });
  },
});
