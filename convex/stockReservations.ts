import { mutation, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const RESERVATION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Reserve stock for checkout — only for in-stock items
export const reserveStock = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        isPreOrder: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check for existing reservation by this user
    const existing = await ctx.db
      .query("stockReservations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // If same session already has reservations, return existing expiry (idempotent)
    const sameSession = existing.filter((r) => r.sessionId === args.sessionId);
    if (sameSession.length > 0) {
      return { expiresAt: sameSession[0].expiresAt };
    }

    const now = Date.now();

    // Check for active reservations from different sessions
    for (const old of existing) {
      if (old.sessionId !== args.sessionId && old.expiresAt > now) {
        // Non-expired reservation on a different session — block multi-device
        throw new Error("You already have an active checkout session. Complete or cancel it first.");
      }
    }

    // Release any expired reservations from different sessions
    for (const old of existing) {
      const product = await ctx.db.get(old.productId);
      if (product?.stock !== undefined) {
        await ctx.db.patch(old.productId, {
          stock: product.stock + old.quantity,
        });
      }
      await ctx.db.delete(old._id);
    }

    const expiresAt = Date.now() + RESERVATION_DURATION_MS;
    const inStockItems = args.items.filter((i) => !i.isPreOrder);

    // Atomically check and decrement stock
    for (const item of inStockItems) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      // Hype product validation
      if (product.isHype === true) {
        if (item.quantity > 1) {
          throw new Error("Hyped models are limited to 1 per person");
        }
        // Check if user already has a non-cancelled order for this hype product
        const userOrders = await ctx.db
          .query("orders")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId as any))
          .collect();
        const alreadyOrdered = userOrders.some(
          (order) =>
            order.orderStatus !== "cancelled" &&
            order.paymentStatus !== "rejected" &&
            order.items.some((oi) => oi.productId === item.productId)
        );
        if (alreadyOrdered) {
          throw new Error("You already have an order for this hyped model");
        }
      }

      if (product.stock === undefined || product.stock < item.quantity) {
        // Rollback any reservations we already made in this loop
        const justCreated = await ctx.db
          .query("stockReservations")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
          .collect();
        for (const r of justCreated) {
          const p = await ctx.db.get(r.productId);
          if (p?.stock !== undefined) {
            await ctx.db.patch(r.productId, { stock: p.stock + r.quantity });
          }
          await ctx.db.delete(r._id);
        }
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      // Decrement stock and create reservation
      await ctx.db.patch(item.productId, {
        stock: product.stock - item.quantity,
      });
      await ctx.db.insert("stockReservations", {
        userId: args.userId,
        productId: item.productId,
        quantity: item.quantity,
        expiresAt,
        sessionId: args.sessionId,
      });
    }

    // Schedule automatic release after 5 minutes
    await ctx.scheduler.runAfter(RESERVATION_DURATION_MS, internal.stockReservations.releaseExpiredForSession, {
      userId: args.userId,
      sessionId: args.sessionId,
    });

    return { expiresAt };
  },
});

// Release stock when user leaves checkout or timer expires
export const releaseStock = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("stockReservations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .collect();

    for (const r of reservations) {
      const product = await ctx.db.get(r.productId);
      if (product?.stock !== undefined) {
        await ctx.db.patch(r.productId, {
          stock: product.stock + r.quantity,
        });
      }
      await ctx.db.delete(r._id);
    }
  },
});

// Consume reservation on successful order (stock already decremented)
export const consumeReservation = mutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("stockReservations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .collect();

    // Just delete reservations without restoring stock
    for (const r of reservations) {
      await ctx.db.delete(r._id);
    }
  },
});

// Scheduled: release expired reservations for a specific session
export const releaseExpiredForSession = internalMutation({
  args: {
    userId: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("stockReservations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .collect();

    for (const r of reservations) {
      // Only release if still past expiry (might have been consumed already)
      if (r.expiresAt <= Date.now()) {
        const product = await ctx.db.get(r.productId);
        if (product?.stock !== undefined) {
          await ctx.db.patch(r.productId, {
            stock: product.stock + r.quantity,
          });
        }
        await ctx.db.delete(r._id);
      }
    }
  },
});

// Periodic cleanup: release all expired reservations (cron safety net)
export const releaseAllExpired = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("stockReservations")
      .withIndex("by_expiresAt")
      .filter((q) => q.lte(q.field("expiresAt"), now))
      .collect();

    for (const r of expired) {
      const product = await ctx.db.get(r.productId);
      if (product?.stock !== undefined) {
        await ctx.db.patch(r.productId, {
          stock: product.stock + r.quantity,
        });
      }
      await ctx.db.delete(r._id);
    }
  },
});
