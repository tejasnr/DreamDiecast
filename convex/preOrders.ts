import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin, requireUser } from "./_utils";
import { decodeBase64DataUrl } from "./_storage";

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
    case "deposit_submitted":
    case "deposit_verified":
    case "stock_arrived":
    case "balance_submitted":
    case "balance_verified":
    case "shipped":
    case "delivered":
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
      status: "deposit_submitted",
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
      depositPaid >= totalPrice ? "fully_paid_shipped" : "deposit_verified";

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
      v.literal("deposit_submitted"),
      v.literal("deposit_verified"),
      v.literal("stock_arrived"),
      v.literal("balance_submitted"),
      v.literal("balance_verified"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("fully_paid_shipped"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    await ctx.db.patch(args.preOrderId, { status: args.status });
  },
});

// Batch-update all pre-orders for a product to stock_arrived
export const markArrivedByProduct = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const preOrders = await ctx.db
      .query("preOrders")
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .collect();

    let count = 0;
    for (const po of preOrders) {
      const s = mapStatus(po.status);
      if (
        s !== "fully_paid_shipped" &&
        s !== "cancelled" &&
        s !== "shipped" &&
        s !== "delivered" &&
        s !== "balance_submitted" &&
        s !== "balance_verified"
      ) {
        await ctx.db.patch(po._id, { status: "stock_arrived" });
        count++;
      }
    }
    return count;
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

// Public query: fetch pre-order for balance payment page (no auth required)
export const getForPayment = query({
  args: { preOrderId: v.id("preOrders") },
  handler: async (ctx, args) => {
    const po = await ctx.db.get(args.preOrderId);
    if (!po) return null;

    const product = await ctx.db.get(po.productId);
    const normalizedStatus = mapStatus(po.status);
    const totalPrice = po.totalPrice ?? po.price ?? 0;
    const depositPaid = po.depositPaid ?? po.depositAmount ?? 0;
    const balanceDue = totalPrice - depositPaid;
    const shippingCharges = 100;
    const totalToPay = balanceDue + shippingCharges;

    return {
      _id: po._id,
      status: normalizedStatus,
      customerName: po.customerName || po.name || "Customer",
      customerPhone: po.customerPhone,
      customerEmail: po.customerEmail,
      productName: po.productName || po.name || "Product",
      productImage: po.productImage || po.image,
      totalPrice,
      depositPaid,
      balanceDue,
      shippingCharges,
      totalToPay,
      balancePaymentStatus: po.balancePaymentStatus,
      shippingAddress: po.shippingAddress,
      product: product
        ? {
            name: product.name,
            image: product.image,
            brand: product.brand,
            scale: product.scale,
          }
        : null,
    };
  },
});

// Internal mutation for balance payment (called from action)
export const insertBalancePayment = internalMutation({
  args: {
    preOrderId: v.id("preOrders"),
    transactionId: v.string(),
    paymentProofStorageId: v.id("_storage"),
    paymentProofUrl: v.string(),
    balanceAmount: v.number(),
    shippingAddress: v.optional(
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
    const po = await ctx.db.get(args.preOrderId);
    if (!po) throw new Error("Pre-order not found");

    const patch: any = {
      balanceTransactionId: args.transactionId,
      balancePaymentProofStorageId: args.paymentProofStorageId,
      balancePaymentProofUrl: args.paymentProofUrl,
      balancePaymentStatus: "submitted",
      balanceAmount: args.balanceAmount,
      balancePaidAt: Date.now(),
      shippingCharges: 100,
      status: "balance_submitted",
    };

    if (args.shippingAddress) {
      patch.shippingAddress = args.shippingAddress;
    }

    await ctx.db.patch(args.preOrderId, patch);
  },
});

// Public action: submit balance payment (no auth required, uses preOrderId as token)
export const submitBalancePayment = action({
  args: {
    preOrderId: v.id("preOrders"),
    transactionId: v.string(),
    paymentProofDataUrl: v.string(),
    shippingAddress: v.optional(
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
    // Store payment proof image
    const { bytes, contentType } = decodeBase64DataUrl(args.paymentProofDataUrl);
    const storageId = await ctx.storage.store(
      new Blob([bytes], { type: contentType })
    );
    const paymentProofUrl = await ctx.storage.getUrl(storageId);
    if (!paymentProofUrl) throw new Error("Failed to store payment proof");

    // Get PO to calculate balance
    const po = await ctx.runQuery(internal.preOrders.getForPaymentInternal, {
      preOrderId: args.preOrderId,
    });
    if (!po) throw new Error("Pre-order not found");

    const balanceAmount = po.totalToPay;

    await ctx.runMutation(internal.preOrders.insertBalancePayment, {
      preOrderId: args.preOrderId,
      transactionId: args.transactionId,
      paymentProofStorageId: storageId,
      paymentProofUrl,
      balanceAmount,
      shippingAddress: args.shippingAddress,
    });

    // Schedule admin email notification for balance payment
    try {
      await ctx.scheduler.runAfter(0, internal.emails.notifyAdminsBalancePayment, {
        preOrderId: args.preOrderId,
        productName: po.productName,
        customerName: po.customerName,
        balanceAmount,
      });
    } catch {
      // Don't fail the payment if email fails
    }
  },
});

// Internal query used by the action above
export const getForPaymentInternal = internalMutation({
  args: { preOrderId: v.id("preOrders") },
  handler: async (ctx, args) => {
    const po = await ctx.db.get(args.preOrderId);
    if (!po) return null;
    const totalPrice = po.totalPrice ?? po.price ?? 0;
    const depositPaid = po.depositPaid ?? po.depositAmount ?? 0;
    const balanceDue = totalPrice - depositPaid;
    const totalToPay = balanceDue + 100;
    return {
      totalToPay,
      productName: po.productName || po.name || "Product",
      customerName: po.customerName || po.name || "Customer",
    };
  },
});

// Admin verifies or rejects balance payment
export const updateBalancePaymentStatus = mutation({
  args: {
    workosUserId: v.optional(v.string()),
    preOrderId: v.id("preOrders"),
    balancePaymentStatus: v.union(v.literal("verified"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);
    const po = await ctx.db.get(args.preOrderId);
    if (!po) throw new Error("Pre-order not found");

    if (args.balancePaymentStatus === "verified") {
      await ctx.db.patch(args.preOrderId, {
        balancePaymentStatus: "verified",
        status: "balance_verified",
      });
    } else {
      await ctx.db.patch(args.preOrderId, {
        balancePaymentStatus: "rejected",
        status: "stock_arrived",
      });
    }
  },
});
