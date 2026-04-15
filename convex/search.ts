import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./_utils";

export const searchOrders = query({
  args: { query: v.string(), workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const q = args.query.toLowerCase();
    if (!q) return [];
    const orders = await ctx.db.query("orders").collect();
    return orders
      .filter(
        (o) =>
          o.userEmail.toLowerCase().includes(q) ||
          o._id.toLowerCase().includes(q) ||
          o.transactionId.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((o) => ({
        _id: o._id,
        userEmail: o.userEmail,
        totalAmount: o.totalAmount,
        orderStatus: o.orderStatus,
      }));
  },
});

export const searchProducts = query({
  args: { query: v.string(), workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const q = args.query.toLowerCase();
    if (!q) return [];
    const products = await ctx.db.query("products").collect();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        image: p.image,
      }));
  },
});

export const searchUsers = query({
  args: { query: v.string(), workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const q = args.query.toLowerCase();
    if (!q) return [];
    const users = await ctx.db.query("users").collect();
    return users
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.name && u.name.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((u) => ({
        _id: u._id,
        name: u.name || "Unknown",
        email: u.email,
      }));
  },
});
