import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./_utils";

export const getCampaigns = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const products = await ctx.db
      .query("products")
      .withIndex("by_listingType", (q) => q.eq("listingType", "pre-order"))
      .collect();

    // Also include legacy pre-order products (category-based or boolean flag)
    const allProducts = await ctx.db.query("products").collect();
    const legacyPOs = allProducts.filter(
      (p) =>
        p.listingType !== "pre-order" &&
        (p.category === "Pre-Order" || p.isPreorder === true)
    );
    const combinedProducts = [...products, ...legacyPOs];

    const allPreOrders = await ctx.db.query("preOrders").collect();

    return combinedProducts.map((product) => {
      const productPOs = allPreOrders.filter(
        (po) => po.productId === product._id
      );
      const activePOs = productPOs.filter((po) => po.status !== "cancelled");

      const pendingBalanceCount = activePOs.filter(
        (po) =>
          po.status === "stock_arrived" &&
          po.balancePaymentStatus !== "verified"
      ).length;

      const verifiedBalanceCount = activePOs.filter(
        (po) =>
          po.status === "balance_verified" ||
          po.balancePaymentStatus === "verified"
      ).length;

      const customerEmails = activePOs
        .map((po) => po.customerEmail)
        .filter(Boolean) as string[];

      return {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku ?? "",
          image: product.image ?? "",
          brand: product.brand,
          scale: product.scale,
          allocatedStock: product.allocatedStock,
          unitsSold: product.unitsSold ?? 0,
          procurementStage: product.procurementStage,
          totalDepositsCollected: product.totalDepositsCollected ?? 0,
          totalLockedBalances: product.totalLockedBalances ?? 0,
          totalFinalPrice: product.totalFinalPrice ?? product.price,
          balanceRequestsSent: product.balanceRequestsSent ?? false,
          status: product.status,
        },
        preOrderCount: activePOs.length,
        pendingBalanceCount,
        verifiedBalanceCount,
        customerEmails,
      };
    });
  },
});

export const getCampaignDetail = query({
  args: {
    workosUserId: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const preOrders = await ctx.db
      .query("preOrders")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    const activePOs = preOrders.filter((po) => po.status !== "cancelled");

    const pendingBalanceCount = activePOs.filter(
      (po) =>
        po.status === "stock_arrived" &&
        po.balancePaymentStatus !== "verified"
    ).length;

    const verifiedBalanceCount = activePOs.filter(
      (po) =>
        po.status === "balance_verified" ||
        po.balancePaymentStatus === "verified"
    ).length;

    const waitlistEntries = await ctx.db
      .query("waitlist")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .collect();

    return {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku ?? "",
        image: product.image ?? "",
        brand: product.brand,
        scale: product.scale,
        allocatedStock: product.allocatedStock,
        unitsSold: product.unitsSold ?? 0,
        procurementStage: product.procurementStage,
        totalDepositsCollected: product.totalDepositsCollected ?? 0,
        totalLockedBalances: product.totalLockedBalances ?? 0,
        totalFinalPrice: product.totalFinalPrice ?? product.price,
        balanceRequestsSent: product.balanceRequestsSent ?? false,
        status: product.status,
      },
      preOrders: preOrders.map((po) => ({
        _id: po._id,
        customerName: po.customerName || po.name || "Unknown",
        customerEmail: po.customerEmail || "",
        status: po.status,
        depositPaid: po.depositPaid ?? po.depositAmount ?? 0,
        balanceAmount:
          po.balanceAmount ??
          (po.totalPrice ?? po.price ?? 0) -
            (po.depositPaid ?? po.depositAmount ?? 0),
        balancePaymentStatus: po.balancePaymentStatus ?? "pending",
      })),
      preOrderCount: activePOs.length,
      pendingBalanceCount,
      verifiedBalanceCount,
      waitlistCount: waitlistEntries.length,
    };
  },
});
