import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireUser } from "./_utils";
import type { Id } from "./_generated/dataModel";

// ── Admin Queries ──────────────────────────────────────────────

export const list = query({
  args: { workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    return await ctx.db.query("coupons").order("desc").collect();
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    return await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
  },
});

export const getStats = query({
  args: { workosUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const allCoupons = await ctx.db.query("coupons").collect();
    const activeCoupons = allCoupons.filter((c) => c.isActive).length;

    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const allRedemptions = await ctx.db.query("couponRedemptions").collect();
    const monthlyRedemptions = allRedemptions.filter(
      (r) => r.redeemedAt >= monthStart.getTime()
    ).length;

    // Top code by total usage
    let topCode = "—";
    if (allCoupons.length > 0) {
      const sorted = [...allCoupons].sort((a, b) => b.timesUsed - a.timesUsed);
      if (sorted[0].timesUsed > 0) topCode = sorted[0].code;
    }

    return { activeCoupons, monthlyRedemptions, topCode };
  },
});

// ── Admin Mutations ────────────────────────────────────────────

export const create = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.union(
      v.literal("percentage"),
      v.literal("flat"),
      v.literal("free_shipping")
    ),
    discountValue: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    perUserLimit: v.optional(v.number()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    applicableBrands: v.optional(v.array(v.string())),
    applicableCategories: v.optional(v.array(v.string())),
    applicableListingTypes: v.optional(
      v.array(v.union(v.literal("in-stock"), v.literal("pre-order")))
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const code = args.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
      throw new Error("Code must be 3-20 characters, alphanumeric and hyphens only");
    }

    // Uniqueness check
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (existing) throw new Error("A coupon with this code already exists");

    // Validate discount value
    if (args.discountType !== "free_shipping") {
      if (!args.discountValue || args.discountValue <= 0) {
        throw new Error("Discount value is required and must be > 0");
      }
      if (args.discountType === "percentage" && (args.discountValue < 1 || args.discountValue > 100)) {
        throw new Error("Percentage must be between 1 and 100");
      }
    }

    // Validate date range
    if (args.validFrom && args.validUntil && args.validFrom >= args.validUntil) {
      throw new Error("Valid From must be before Valid Until");
    }

    const { workosUserId: _, ...rest } = args;
    return await ctx.db.insert("coupons", {
      ...rest,
      code,
      timesUsed: 0,
    });
  },
});

export const update = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    id: v.id("coupons"),
    description: v.optional(v.string()),
    discountType: v.union(
      v.literal("percentage"),
      v.literal("flat"),
      v.literal("free_shipping")
    ),
    discountValue: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    maxDiscountAmount: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    perUserLimit: v.optional(v.number()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    applicableBrands: v.optional(v.array(v.string())),
    applicableCategories: v.optional(v.array(v.string())),
    applicableListingTypes: v.optional(
      v.array(v.union(v.literal("in-stock"), v.literal("pre-order")))
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const coupon = await ctx.db.get(args.id);
    if (!coupon) throw new Error("Coupon not found");

    if (args.discountType !== "free_shipping") {
      if (!args.discountValue || args.discountValue <= 0) {
        throw new Error("Discount value is required and must be > 0");
      }
      if (args.discountType === "percentage" && (args.discountValue < 1 || args.discountValue > 100)) {
        throw new Error("Percentage must be between 1 and 100");
      }
    }

    if (args.validFrom && args.validUntil && args.validFrom >= args.validUntil) {
      throw new Error("Valid From must be before Valid Until");
    }

    const { workosUserId: _, id, ...rest } = args;
    await ctx.db.patch(args.id, rest);
  },
});

export const toggleActive = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    id: v.id("coupons"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const coupon = await ctx.db.get(args.id);
    if (!coupon) throw new Error("Coupon not found");
    await ctx.db.patch(args.id, { isActive: !coupon.isActive });
  },
});

export const remove = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    id: v.id("coupons"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const coupon = await ctx.db.get(args.id);
    if (!coupon) throw new Error("Coupon not found");

    if (coupon.timesUsed > 0) {
      // Soft-disable instead of hard-delete
      await ctx.db.patch(args.id, { isActive: false });
      return { softDisabled: true };
    }
    await ctx.db.delete(args.id);
    return { softDisabled: false };
  },
});

// ── Validation (used client-side and server-side) ─────────────

export const validateCoupon = query({
  args: {
    code: v.string(),
    userId: v.id("users"),
    cartItems: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        brand: v.string(),
        category: v.string(),
        listingType: v.optional(v.string()),
      })
    ),
    subtotal: v.number(),
  },
  handler: async (ctx, args) => {
    return await runValidation(ctx, args);
  },
});

// Shared validation logic usable from both query and internal contexts
async function runValidation(
  ctx: any,
  args: {
    code: string;
    userId: Id<"users">;
    cartItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      brand: string;
      category: string;
      listingType?: string;
    }>;
    subtotal: number;
  }
) {
  const code = args.code.trim().toUpperCase();
  const fail = (reason: string) => ({ valid: false as const, reason });

  // 1. Exists
  const coupon = await ctx.db
    .query("coupons")
    .withIndex("by_code", (q: any) => q.eq("code", code))
    .unique();
  if (!coupon) return fail("Invalid coupon code");

  // 2. Active
  if (!coupon.isActive) return fail("This coupon is no longer active");

  // 3. Validity window
  const now = Date.now();
  if (coupon.validFrom && now < coupon.validFrom) return fail("This coupon is not yet active");
  if (coupon.validUntil && now > coupon.validUntil) return fail("This coupon has expired");

  // 4. Usage limit
  if (coupon.usageLimit !== undefined && coupon.timesUsed >= coupon.usageLimit) {
    return fail("This coupon has reached its usage limit");
  }

  // 5. Per-user limit
  if (coupon.perUserLimit !== undefined) {
    const userRedemptions = await ctx.db
      .query("couponRedemptions")
      .withIndex("by_userId_couponId", (q: any) =>
        q.eq("userId", args.userId).eq("couponId", coupon._id)
      )
      .collect();
    if (userRedemptions.length >= coupon.perUserLimit) {
      return fail("You've already used this coupon");
    }
  }

  // 6. Min order amount
  if (coupon.minOrderAmount && args.subtotal < coupon.minOrderAmount) {
    return fail(`Minimum order of ₹${coupon.minOrderAmount} required`);
  }

  // 7. Scope filters — determine qualifying items
  let qualifyingItems = args.cartItems;

  if (coupon.applicableBrands && coupon.applicableBrands.length > 0) {
    qualifyingItems = qualifyingItems.filter((item) =>
      coupon.applicableBrands!.includes(item.brand)
    );
  }
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    qualifyingItems = qualifyingItems.filter((item) =>
      coupon.applicableCategories!.includes(item.category)
    );
  }
  if (coupon.applicableListingTypes && coupon.applicableListingTypes.length > 0) {
    qualifyingItems = qualifyingItems.filter((item) => {
      const lt = item.listingType || "in-stock";
      return coupon.applicableListingTypes!.includes(lt as any);
    });
  }

  if (qualifyingItems.length === 0) {
    return fail("This coupon doesn't apply to items in your cart");
  }

  // Calculate qualifying subtotal
  const qualifyingSubtotal = qualifyingItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Discount calculation
  let discountAmount = 0;
  let shippingWaived = false;
  let message = "";

  if (coupon.discountType === "percentage") {
    discountAmount = Math.round(
      Math.min(
        (qualifyingSubtotal * (coupon.discountValue ?? 0)) / 100,
        coupon.maxDiscountAmount ?? Infinity
      )
    );
    message = `${coupon.code} applied — ${coupon.discountValue}% off! You saved ₹${discountAmount}`;
  } else if (coupon.discountType === "flat") {
    discountAmount = Math.min(coupon.discountValue ?? 0, qualifyingSubtotal);
    message = `${coupon.code} applied — ₹${discountAmount} off!`;
  } else if (coupon.discountType === "free_shipping") {
    shippingWaived = true;
    message = `${coupon.code} applied — Free shipping!`;
  }

  return {
    valid: true as const,
    couponId: coupon._id,
    discountType: coupon.discountType,
    discountAmount,
    shippingWaived,
    message,
    code: coupon.code,
  };
}

// ── Internal: server-side re-validation for order creation ────

export const validateCouponInternal = internalMutation({
  args: {
    code: v.string(),
    userId: v.id("users"),
    cartItems: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        brand: v.string(),
        category: v.string(),
        listingType: v.optional(v.string()),
      })
    ),
    subtotal: v.number(),
  },
  handler: async (ctx, args) => {
    return await runValidation(ctx, args);
  },
});

// ── Internal: record redemption after order success ───────────

export const recordRedemption = internalMutation({
  args: {
    couponId: v.id("coupons"),
    userId: v.id("users"),
    orderId: v.id("orders"),
    code: v.string(),
    discountApplied: v.number(),
    shippingWaived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("couponRedemptions", {
      couponId: args.couponId,
      userId: args.userId,
      orderId: args.orderId,
      code: args.code,
      discountApplied: args.discountApplied,
      shippingWaived: args.shippingWaived,
      redeemedAt: Date.now(),
    });

    // Increment timesUsed
    const coupon = await ctx.db.get(args.couponId);
    if (coupon) {
      await ctx.db.patch(args.couponId, {
        timesUsed: coupon.timesUsed + 1,
      });
    }
  },
});
