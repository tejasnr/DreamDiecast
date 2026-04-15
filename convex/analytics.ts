import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./_utils";

export const getDashboardMetrics = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    // Verified orders revenue
    const orders = await ctx.db.query("orders").collect();
    const verifiedOrders = orders.filter((o) => o.paymentStatus === "verified");
    const ordersRevenue = verifiedOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );

    // Pre-order deposit revenue (deposit_verified or later non-cancelled statuses)
    const preOrders = await ctx.db.query("preOrders").collect();
    const verifiedDeposits = preOrders.filter((po) =>
      [
        "deposit_verified",
        "stock_arrived",
        "balance_submitted",
        "balance_verified",
        "shipped",
        "delivered",
        "fully_paid_shipped",
      ].includes(po.status)
    );
    const depositsRevenue = verifiedDeposits.reduce(
      (sum, po) => sum + (po.depositPaid ?? po.depositAmount ?? 0),
      0
    );

    // Balance payments that are verified
    const verifiedBalances = preOrders.filter(
      (po) => po.balancePaymentStatus === "verified"
    );
    const balanceRevenue = verifiedBalances.reduce(
      (sum, po) => sum + (po.balanceAmount ?? 0),
      0
    );

    const totalRevenue = ordersRevenue + depositsRevenue + balanceRevenue;

    // Locked dues: sum of balanceAmount from pre-orders where deposit is verified
    // but balance is not yet verified and not cancelled
    const lockedDues = preOrders
      .filter(
        (po) =>
          ["deposit_verified", "stock_arrived", "balance_submitted"].includes(
            po.status
          ) && po.balancePaymentStatus !== "verified"
      )
      .reduce((sum, po) => {
        const totalPrice = po.totalPrice ?? po.price ?? 0;
        const depositPaid = po.depositPaid ?? po.depositAmount ?? 0;
        return sum + (po.balanceAmount ?? totalPrice - depositPaid);
      }, 0);

    // Count non-cancelled orders + pre-orders
    const activeOrders = orders.filter(
      (o) => o.orderStatus !== "cancelled"
    ).length;
    const activePreOrders = preOrders.filter(
      (po) => po.status !== "cancelled"
    ).length;
    const totalOrders = activeOrders + activePreOrders;

    const verifiedCount = verifiedOrders.length + verifiedDeposits.length;
    const averageOrderValue =
      verifiedCount > 0 ? Math.round(totalRevenue / verifiedCount) : 0;

    return {
      totalRevenue,
      lockedDues,
      averageOrderValue,
      totalOrders,
    };
  },
});

export const getAlerts = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const alerts: Array<{
      type: "balance_not_requested" | "sold_out" | "pending_verification";
      productId?: string;
      productName: string;
      message: string;
      severity: "critical" | "warning";
    }> = [];

    const products = await ctx.db.query("products").collect();

    // 1. Balance Not Requested — inventory_ready but balanceRequestsSent !== true
    for (const p of products) {
      if (
        p.procurementStage === "inventory_ready" &&
        p.balanceRequestsSent !== true
      ) {
        alerts.push({
          type: "balance_not_requested",
          productId: p._id,
          productName: p.name,
          message: `${p.name} is in-hand but balance requests haven't been sent.`,
          severity: "critical",
        });
      }
    }

    // 2. Sold Out — pre-order product fully allocated but still listed
    for (const p of products) {
      const isPreOrder =
        p.listingType === "pre-order" ||
        p.category === "Pre-Order" ||
        p.isPreorder === true;
      if (
        isPreOrder &&
        p.allocatedStock !== undefined &&
        (p.unitsSold ?? 0) >= p.allocatedStock &&
        p.status !== "unlisted"
      ) {
        alerts.push({
          type: "sold_out",
          productId: p._id,
          productName: p.name,
          message: `${p.name} is fully sold — consider restocking or checking the waitlist.`,
          severity: "warning",
        });
      }
    }

    // 3. Pending Verification — orders with paymentStatus === "submitted"
    const orders = await ctx.db.query("orders").collect();
    const pendingCount = orders.filter(
      (o) => o.paymentStatus === "submitted"
    ).length;
    if (pendingCount > 0) {
      alerts.push({
        type: "pending_verification",
        productName: "",
        message: `${pendingCount} order${pendingCount > 1 ? "s" : ""} awaiting payment verification.`,
        severity: "warning",
      });
    }

    // Cap at 10
    return alerts.slice(0, 10);
  },
});

export const getTopPerformers = query({
  args: { workosUserId: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.workosUserId);

    const products = await ctx.db.query("products").collect();
    const preOrders = await ctx.db.query("preOrders").collect();
    const orders = await ctx.db.query("orders").collect();

    // Revenue map: productId -> { revenue, unitsSold, name, image }
    const revenueMap = new Map<
      string,
      { revenue: number; unitsSold: number; name: string; image: string }
    >();

    // Pre-order revenue per product
    for (const po of preOrders) {
      if (po.status === "cancelled") continue;
      const verified = [
        "deposit_verified",
        "stock_arrived",
        "balance_submitted",
        "balance_verified",
        "shipped",
        "delivered",
        "fully_paid_shipped",
      ].includes(po.status);
      if (!verified) continue;

      const pid = po.productId;
      const entry = revenueMap.get(pid) ?? {
        revenue: 0,
        unitsSold: 0,
        name: "",
        image: "",
      };
      entry.revenue += po.depositPaid ?? po.depositAmount ?? 0;
      if (po.balancePaymentStatus === "verified") {
        entry.revenue += po.balanceAmount ?? 0;
      }
      entry.unitsSold += 1;
      revenueMap.set(pid, entry);
    }

    // Regular order revenue per product
    for (const order of orders) {
      if (order.paymentStatus !== "verified") continue;
      for (const item of order.items) {
        const pid = item.productId;
        const entry = revenueMap.get(pid) ?? {
          revenue: 0,
          unitsSold: 0,
          name: "",
          image: "",
        };
        entry.revenue += item.price * item.quantity;
        entry.unitsSold += item.quantity;
        revenueMap.set(pid, entry);
      }
    }

    // Enrich with product details
    const productMap = new Map(products.map((p) => [p._id, p]));
    for (const [pid, entry] of revenueMap) {
      const product = productMap.get(pid as any);
      if (product) {
        entry.name = product.name;
        entry.image = product.image ?? "";
      }
    }

    // Sort by revenue descending, take top N
    const sorted = [...revenueMap.entries()]
      .filter(([, e]) => e.revenue > 0)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, args.limit);

    return sorted.map(([productId, data]) => ({
      productId,
      productName: data.name,
      revenue: data.revenue,
      unitsSold: data.unitsSold,
      image: data.image,
    }));
  },
});
